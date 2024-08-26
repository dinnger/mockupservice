import { Prometeo } from '../../horizonShare/prometeo.js'
import { v4 as uuid } from 'uuid'
import { extractFile } from '../utils/utils.js'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const path = require('path')

export async function deployExtractData ({ model, dataGit }) {
  const { get } = new Prometeo()

  const flowData = model.properties.value
  const PATH_URL = process.env.PATH_URL.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL
  const namespace = flowData.namespace
  const flow = `${flowData.id}.${namespace}.${flowData.name}`
  const flowName = `${flowData.name}`
  const basePath = flowData.config?.router?.base || '/'
  const flowUrl = process.env.BASE_URL + PATH_URL + `/ui/flows/${flowData.id}`

  let { deployPre, deployPk } = gitPromiseData({ get, model })
  deployPre = Object.entries(deployPre).map(([key, _]) => key).join('\n')
  deployPk = Object.entries(deployPk).map(([key, _]) => `RUN npm i ${key}`).join('\n')

  // Renombrando carpeta git
  const instance = 'dev'
  const obj = {
    flowId: flowData.id,
    flow: flow.toLowerCase(),
    flowName: flowName.toLowerCase(),
    flowOrigin: flow,
    basePath,
    instance,
    deployPre: deployPre.replace(/\r\n/g, '\n'),
    deployPk: deployPk.replace(/\r\n/g, '\n'),
    flowUrl
  }
  const path = await gitNewFolder({ data: dataGit, flowName: obj.flowName })
  await gitReplaceFiles({ path, obj })
  return { dataReplace: obj, path }
}

async function gitNewFolder ({ data, flowName }) {
  const { pathDir, set, remove } = new Prometeo()
  const name = uuid()
  const fileZip = data.file.toString('base64')

  pathDir().new({ path: `./_deploy/_${name}`, recursive: true })

  set().file({
    path: `./_deploy/_${name}.zip`,
    data: fileZip,
    format: 'base64'
  })
  const absolutePath = path.resolve(`./_deploy/_${name}`)
  await extractFile({
    origin: `./_deploy/_${name}.zip`,
    destiny: absolutePath
  })
  remove({
    path: `./_deploy/_${name}.zip`,
    force: true,
    recursive: true
  })
  remove({
    path: `./_deploy/${flowName}`,
    force: true,
    recursive: true
  })
  return `_${name}`
}

async function gitReplaceFiles ({ path, obj }) {
  const { get, set, remove, copy } = new Prometeo()
  path = `./_deploy/${path}`
  try {
  // Creando los archivos necesarios del flujo
    // copy({ sourcePath: `./_deploy/${gitDeploy}`, targetPath: `${path}`, recursive: true })
    // Analizando
    const regex = /{{[^}]*}}/g
    const list = get().filesByPath({ path, recursive: true })
    list.filter(f => !f.isDirectory && f.path.indexOf('/.git/') === -1).forEach(file => {
      const fileData = get().readFile({ path: `${file.path}/${file.name}` })
      let data = fileData.data.replace(/\r\n/g, '\n')
      const matchReplace = data.match(regex)
      if (matchReplace) {
        matchReplace.forEach(el => {
          const objKey = el.replace(/\{\{|\}\}/g, '').trim()
          if (obj[objKey] != null) data = data.replace(el, obj[objKey])
        })
        // Guardando el cambio
        set().file({ path: `${fileData.path}/${fileData.name}`, data })
      }
    })

    // Copiando archivos base
    set().newPath({ path: `${path}/environment/`, recursive: true })
    copy({ sourcePath: './horizonServer', targetPath: `${path}/horizonServer`, recursive: true })
    copy({ sourcePath: './horizonShare', targetPath: `${path}/horizonShare`, recursive: true })
    copy({ sourcePath: './horizonWorker', targetPath: `${path}/horizonWorker`, recursive: true })
    copy({ sourcePath: './server', targetPath: `${path}/server`, recursive: true })
    copy({ sourcePath: `./_flows/${obj.flowOrigin}`, targetPath: `${path}/_flows/${obj.flowOrigin}`, recursive: true })
    copy({ sourcePath: './package.json', targetPath: `${path}/package.json`, recursive: true })
    // Modificando package para contener lo escencial
    let infoPackage = get().readFile({ path: `${path}/package.json` })
    infoPackage = JSON.parse(infoPackage.data)
    delete infoPackage.devDependencies
    set().file({ path: `${path}/package.json`, data: JSON.stringify(infoPackage, null, ' ') })
    return path
  } catch (err) {
    console.log(err)
    remove({ path: `${path}`, force: true, recursive: true })
    return null
  }
}

function gitPromiseData ({ get, model }) {
  const deployPre = {}
  const deployPk = {}
  const infoPackage = JSON.parse(get().readFile({ path: './package.json' }).data)
  const nodes = model.nodes.value
  Object.entries(nodes).forEach(([key, item]) => {
    const classString = model.nodesClass[item.type].class.toString()
    classString
      .split('\n')
      .filter(f => f.indexOf('// #pre') >= 0 || f.indexOf('// #pk') >= 0)
      .forEach(m => {
        if (m.indexOf('// #pre') >= 0) {
          const obj = m.substring(m.indexOf('// #pre') + 7).trim()
          deployPre[obj] = 1
        }
        if (m.indexOf('// #pk') >= 0) {
          const obj = m.substring(m.indexOf('// #pk') + 6).trim()
          const version = infoPackage.dependencies[obj] ?? infoPackage.devDependencies[obj]
          if (version) deployPk[`${obj}@${version.replace(/\^/g, '')}`] = 1
          if (!version) deployPk[`${obj}`] = 1
        }
      })
  })
  return { deployPre, deployPk }
}
