import fs from 'fs'
import { isConnect } from './database/connect.js'
import { App } from './application/app.js'

const appInstance = new App()

export const initServer = async () => {
  await initPath()

  return new Promise((resolve, reject) => {
    isConnect(async ({ error }) => {
      if (error) return reject(error)

      const listFlows = await appInstance.flow().get()
      const envFlows = await appInstance.flow().variables().all()
      const docFlows = await appInstance.flow().documentation().all()
      await clearFiles({ dir: '_flows' })
      await reloadFiles({ dir: '_flows', list: listFlows, env: envFlows, doc: docFlows })

      resolve({ appInstance })
    })
  })
}

function initPath () {
  console.log('[Server]', 'Inicializando directorios')
  if (!fs.existsSync('./_flows')) fs.mkdirSync('./_flows')
  if (!fs.existsSync('./_flows_deploy')) fs.mkdirSync('./_flows_deploy')
  if (!fs.existsSync('./_database')) fs.mkdirSync('./_database')
  if (!fs.existsSync('./horizonServer/deploy')) fs.mkdirSync('./horizonServer/deploy')
  if (process.env.LOG_PATH && !fs.existsSync(process.env.LOG_PATH)) fs.mkdirSync(process.env.LOG_PATH, { recursive: true, force: true })
}

async function clearFiles ({ dir }) {
  console.log('[Server]', 'Limpiando archivos')
  const dirPath = `./${dir}/`
  const files = fs.readdirSync(dirPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
  files.forEach(file => {
    fs.rmSync(`${dirPath}${file}`, { force: true, recursive: true })
  })
}

async function reloadFiles ({ dir, list, env, doc }) {
  console.log('[Server]', 'Recargando archivos de flujos y variables')

  list.forEach(element => {
    const id = element.id
    const name = element.name
    const namespace = element?.flow_namespace?.name || element?.process_namespace?.name
    const alias = element.user?.dataValues?.owner || ''
    let data = element.flow || element.data
    data.properties = data.flow || data.process || data.properties
    data.properties.owner = {
      id: element.ownerUser,
      alias
    }
    delete data.flow
    delete data.process
    data = JSON.stringify(data)
    if (!fs.existsSync(`./${dir}/${id}.${namespace}.${name}`)) fs.mkdirSync(`./${dir}/${id}.${namespace}.${name}`, { recursive: true })
    if (!fs.existsSync(`./${dir}/${id}.${namespace}.${name}/_doc`)) fs.mkdirSync(`./${dir}/${id}.${namespace}.${name}/_doc`, { recursive: true })
    fs.writeFileSync(`./${dir}/${id}.${namespace}.${name}/${name}.flow`, JSON.stringify(JSON.parse(data), null, ' '))
  })

  env.forEach(element => {
    const id = element?.flow?.id || element?.process?.id || element?.properties.id
    const name = element?.flow?.name || element?.process?.name || element?.properties.name
    const namespace = element?.flow?.flow_namespace.name || element?.process?.process_namespace.name || element?.properties.namespace.name
    if (element.config) fs.writeFileSync(`./${dir}/${id}.${namespace}.${name}/flow.conf`, JSON.stringify(element.config, null, ' '))
  })

  if (doc) {
    doc.forEach((element, index) => {
      const id = element.id
      const name = element.name
      const namespace = element?.flow_namespace.name || element?.process_namespace.name

      appInstance.flow().documentation().generateTest({ id, namespace, flow: name, index })
    })
  }
}
