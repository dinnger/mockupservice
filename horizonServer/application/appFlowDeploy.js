import { db, Op } from '../database/connect.js'
import { Modeler } from '../../horizonShare/modeler.js'
import { moduleListServer, serverModuleLoad } from '../../horizonShare/plugins/registryServer.js'
import { createRequire } from 'node:module'
import { Prometeo } from '../../horizonShare/prometeo.js'
import { extractFile } from '../utils/utils.js'
import { deployExtractData } from './appFlowDeployExtract.js'

export default function () {
  return {
    // flow/deploy/list
    list,
    // flow/deploy/methods
    methods,
    //  flow/deploy/actions
    actions
  }
}

async function list () {
  const listDeploy = await db.FLOWS.FLOW_DEPLOY.findAll({
    // attributes: { exclude: ['file'] },
    include: [
      {
        attributes: [['alias', 'owner']],
        model: db.SECURITY.USERS,
        required: true
      }
    ],
    where: {
      active: true
    },
    order: [['name', 'asc']]
  })
  const list = listDeploy.map((m) => {
    return {
      ...m.dataValues,
      file: !!m.file
    }
  })
  return list
}

async function methods () {
  return {
    // flow/deploy/getFile
    async list () {
      const list = await moduleListServer({ path: 'deploy' })
      return list.map((m) => m.file.split('.')[0])
    },
    async fields ({ methodsName }) {
      const method = await serverModuleLoad({ path: `deploy/${methodsName}` })
      if (!method) return { error: 'No existe el método' }
      if (!method.fields) return { error: 'El método no tiene campos' }
      return method.fields()
    }
  }
}

function actions () {
  return {
    // flow/deploy/actions/getFile
    async getFile ({ idDeploy }) {
      const file = await db.FLOWS.FLOW_DEPLOY.findOne({
        attributes: ['id', 'file'],
        where: { id: idDeploy }
      })
      if (!file || !file.file) return { error: 'Sin archivo' }
      return file.file.toString('base64')
    },
    // flow/deploy/actions/updateFile
    async updateFile ({ idDeploy, file }) {
      return db.FLOWS.FLOW_DEPLOY.update(
        {
          file
        },
        {
          where: { id: idDeploy }
        }
      )
    },
    // flow/deploy/actions/new
    async new ({
      name,
      type,
      data,
      session
    }) {
      const exist = await db.FLOWS.FLOW_DEPLOY.findOne({
        where: {
          name: {
            [Op.iLike]: name
          }
        }
      })
      if (exist) return { error: 'Ya existe un despliegue con este nombre' }
      try {
        const file = (data.elements.file && data.elements.file?.value.length > 0) ? data.elements.file?.value[0].file : null
        delete data.elements.file
        return await db.FLOWS.FLOW_DEPLOY.create({
          name,
          type,
          data,
          file,
          active: true,
          createdUser: session.id
        })
      } catch (error) {
        return { error: error.toString() }
      }
    },
    // flow/deploy/newDir
    async newDir ({ id, dir, session }) {
      const infoDeploy = await db.FLOWS.FLOW_DEPLOY.update(
        {
          dir
        },
        {
          where: { id }
        }
      )
      return infoDeploy
    },

    // flow/deploy/params
    async params ({ id, params }) {
      return db.FLOWS.FLOW_DEPLOY.update(
        {
          parameters: params
        },
        {
          where: { id }
        }
      )
    },
    // flow/deploy/getInfo
    async getInfo ({ idFlow }) {
      if (!idFlow) return null
      const data = await db.FLOWS.FLOW.findOne({
        attributes: [
          'id',
          'flow',
          'name',
          'git',
          'deployDir',
          'deployParameters'
        ],
        include: [
          {
            attributes: ['name', 'idGroup'],
            model: db.FLOWS.FLOW_NAMESPACES,
            required: true,
            include: [
              {
                attributes: { exclude: ['file'] },
                model: db.FLOWS.FLOW_DEPLOY,
                required: true
              }
            ]
          }
        ],
        where: {
          active: true,
          id: idFlow
        }
      })

      const list = data?.flow_namespace?.flow_deploy?.parameters
      let parameters = []
      if (list) {
        parameters = list.map((m) => {
          const flowParameters = data.deployParameters
            ? data.deployParameters.find((f) => f.key === m.key)
            : null
          return {
            key: m.key,
            value: flowParameters?.value || m.value,
            save: !!flowParameters || false
          }
        })
      }
      const dir = []

      return {
        dir,
        parameters
      }
    },
    // flow/deploy/newDeploy
    async newDeploy ({ idFlow, commit, deploy, session }) {
      const list = await moduleListServer({ path: 'deploy' })
      const exist = list.find(m => m.file.split('.')[0] === deploy.type)
      if (!exist) return { error: 'No existe el módulo' }
      const uuid = exist.uuid
      const { Deploy } = await serverModuleLoad({ path: 'deploy', uuid })
      if (!Deploy) return { error: 'No existe el módulo' }
      const data = await db.FLOWS.FLOW.findOne({
        attributes: ['id', 'flow', 'name', 'git', 'deployParameters'],
        where: {
          active: true,
          id: idFlow
        }
      })

      const flowGit = data.git
      const moduleList = await moduleListServer({ path: 'nodes' })
      const model = new Modeler({ origin: 'server' })
      await model.modelLoad({
        model: data.flow,
        type: 'flow',
        moduleList,
        moduleLoad: serverModuleLoad
      })

      const dataGit = await db.FLOWS.FLOW_DEPLOY.findOne({
        attributes: ['id', 'type', 'name', 'data', 'file'],
        where: {
          type: flowGit?.type || 'local',
          name: flowGit?.name || ''
        }
      })

      const { path, dataReplace } = await deployExtractData({ model, dataGit })
      delete dataGit.dataValues.file
      const instanceDeploy = await new Deploy({ path, dataReplace, dataGit: dataGit.dataValues, flowGit, commit, session })
      try {
        const data = await instanceDeploy.init()
        await db.FLOWS.FLOW.update({
          git: { ...flowGit, url: data.urlGit }
        }, {
          where: { id: idFlow }
        })
        return { urlGit: data.urlGit }
      } catch (error) {
        return { error: error.toString() }
      }
    },

    async listFiles ({ idDeploy }) {
      const require = createRequire(import.meta.url)
      const path = require('path')
      const { get, set, remove, pathDir } = new Prometeo()

      try {
        const data = await db.FLOWS.FLOW_DEPLOY.findOne({
          attributes: ['id', 'name', 'file'],
          where: {
            id: idDeploy
          }
        })
        const name = data.name
        const fileZip = data.file.toString('base64')

        pathDir().new({ path: `./_deploy/${name}`, recursive: true })

        set().file({
          path: `./_deploy/_${name}.zip`,
          data: fileZip,
          format: 'base64'
        })
        const absolutePath = path.resolve(`./_deploy/${name}`)
        await extractFile({
          origin: `./_deploy/_${name}.zip`,
          destiny: absolutePath
        })
        remove({
          path: `./_deploy/_${name}.zip`,
          force: true,
          recursive: true
        })
        const list = get().filesByPath({
          path: `./_deploy/${name}`,
          recursive: true
        })
        return {
          name,
          list
        }
      } catch (error) {
        return { error: error.toString() }
      }
    },
    async get ({ deploy, path }) {
      const { get } = new Prometeo()
      const data = get().readFile({ path: `./_deploy/${deploy}/${path}` })
      return data
    },
    async save ({ deploy, files }) {
      const require = createRequire(import.meta.url)
      const AdmZip = require('adm-zip')
      const zip = new AdmZip()
      try {
        const { set, remove } = new Prometeo()
        Object.entries(files).forEach(([path, data]) => {
          set().file({
            path: `./_deploy/${deploy}/${path}`,
            data: data.content
          })
        })
        // Generar zip y guardar en base de dato
        const path = require('path')

        const name = deploy
        const zipFile = path.resolve(`./_deploy/${name}.zip`)
        // list.forEach(file => {
        const zipF = path.resolve(`./_deploy/${deploy}`)
        zip.addLocalFolder(zipF)
        zip.writeZip(zipFile)
        // })
        const fs = require('fs')
        const file = fs.readFileSync(zipFile)
        remove({ path: zipFile, force: true })
        remove({ path: `./_deploy/${name}`, force: true, recursive: true })
        await db.FLOWS.FLOW_DEPLOY.update(
          {
            file
          },
          {
            where: { name: deploy }
          }
        )
        return { success: true }
      } catch (error) {
        return { error: error.toString() }
      }
    }
  }
}
