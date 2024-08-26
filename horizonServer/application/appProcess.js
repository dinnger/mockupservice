import { Op, db, sequelize } from '../database/connect.js'
import appProcessNamespace from './appProcessNamespace.js'
import fs from 'fs'
import { glob } from 'glob'

let listDeploy = null

export default function ({ el } = {}) {
  return {
    /**
     * infoFlow
     * @param {*} param0
     * @returns
    */
    async info ({ id, attributes = ['id', 'idNamespace', 'name', 'description', 'version', 'data', 'active', 'createdAt'] }) {
      return db.PROCESSES.PROCESS.findOne({
        attributes,
        include: [
          {
            attributes: [['name', 'namespace'], 'active'],
            model: db.PROCESSES.PROCESS_NAMESPACES,
            required: true

          },
          {
            attributes: [['alias', 'owner']],
            model: db.SECURITY.USERS,
            required: true
          }
        ],
        where: {
          id,
          active: true
        }
      })
    },
    /**
     * get
     * @param {*} param0
     * @returns
     */
    async get ({ filter, image = true } = {}) {
      const attributes = ['id', 'idNamespace', 'name', 'description', 'version', 'data', 'createdAt']
      const where = {
        active: true
      }
      if (image) attributes.push('image')
      if (filter) {
        where.id = { [Op.in]: filter.map(m => parseInt(m)) }
      }
      const data = await db.PROCESSES.PROCESS.findAll({
        attributes,
        include: [
          {
            attributes: ['name'],
            model: db.PROCESSES.PROCESS_NAMESPACES,
            where: {
              active: true
            },
            required: true
          },
          {
            attributes: [['alias', 'owner']],
            model: db.SECURITY.USERS,
            required: true
          }
        ],
        where,
        order: [
          ['idNamespace', 'asc'],
          ['name', 'asc']
        ]
      })

      const listFlows = data.map(m => {
        return {
          ...m.dataValues
        }
      })
      return listFlows
    },
    /**
     * list - Lista de flujos
     * @param {*} param0
     * @returns
     */
    async list ({ session, filter, image = true }) {
      if (!session) return []
      const arrP = session.permissions || []
      const validCore = (f) => (f.process_namespace.name[0] !== '_' || (f.process_namespace.name[0] === '_' && arrP.find(f => f === 'flujo_core')))
      const validNamespace = (f) => {
        return (session.namespaces && session.namespaces.indexOf('*') >= 0) ||
      (session.namespaces && session.namespaces.find(s => s === f.idNamespace.toString()))
      }
      const validProject = (f) => {
        return (session.projects && session.projects.indexOf('*') >= 0) ||
      (session.projects && session.projects.find(s => s === f.id.toString()))
      }

      let list = await this.get({ image, filter })
      list = list
        .filter(f => validCore(f) && validNamespace(f) && validProject(f))
        .map(m => {
          return {
            id: m.id,
            idNamespace: m.idNamespace,
            name: m.name,
            description: m.description,
            version: m.version,
            process_namespace: m.process_namespace,
            user: m.user,
            image: m.image
          }
        })
      return list
    },
    /**
     * new - Nuevo flow
     * @param {*} param0
     * @returns
     */
    new ({ namespace, name, description, session }) {
      const data = { properties: { namespace, name, description, config: { logs: { logsError: true }, router: { base: '' } } }, nodes: [] }
      return this.save({ namespace, name, data, session })
    },
    /**
     * save - Guarda información del flow
     * @param {id,  name, namespace, data, session, image, reload = true} param0
     * @returns
     */
    async save ({ id, name, namespace, data, session, image, reload = true } = {}) {
      let idProcess = id
      data.properties.latest = true
      // Variables
      let env = ''
      if (data.properties?.variables) {
        Object.entries(data.properties.variables).forEach(([key, value]) => { env += `${key}="${encodeURI(value)}"\n` })
        delete data.properties.variables
      }

      // Nuevo Flujo
      if (!id) {
        data.properties.version = 1
        const listNamespaces = await appProcessNamespace().list({ session })
        const namespaceS = listNamespaces.find(f => f.name.indexOf(namespace) === 0)
        data.properties.namespace = namespaceS.name

        if (!await db.PROCESSES.PROCESS.findOne({ where: { name, idNamespace: namespaceS.id } })) {
          const result = await db.PROCESSES.PROCESS.create({
            idNamespace: namespaceS.id,
            name,
            description: data.properties.description,
            data,
            version: 1,
            active: true,
            image,
            createdUser: session.id
          })
          // Guardando Variables
          idProcess = result.id
          if (!fs.existsSync(`./_processes/${idProcess}.${namespace}.${name}`)) fs.mkdirSync(`./_processes/${idProcess}.${namespace}.${name}`)
          if (!fs.existsSync(`./_processes/${idProcess}.${namespace}.${name}/_workdir`)) fs.mkdirSync(`./_processes/${idProcess}.${namespace}.${name}/_workdir`)
          this.variables().save({ idProcess: result.id, env, createdUser: session.id })

          fs.writeFileSync(`./_processes/${idProcess}.${namespace}.${name}/${name}.flow`, JSON.stringify(data))
          await this.get({ reload: true })
          return result
        }
        return { error: 'Ya existe un proceso manual con este nombre' }
      } else {
        // si cuenta con id
        const processInfo = await this.info({ id })
        // eslint-disable-next-line n/no-callback-literal
        if (!processInfo) return { error: 'No se encuentra el flujo de trabajo o se encuentra deshabilitado' }
        // eslint-disable-next-line n/no-callback-literal
        if (!processInfo.process_namespace.active) return { error: 'No se encuentra el directorio asociado al flujo de trabajo.' }

        namespace = processInfo.process_namespace.dataValues.namespace
        name = processInfo.name
        data.properties.namespace = namespace

        if (data.properties?.variables) {
          let env = ''
          Object.entries(data.properties.variables).forEach(([key, value]) => {
            env += `${key}="${encodeURI(value)}"\n`
          })
          fs.writeFileSync(`./_processes/${idProcess}.${namespace}.${name}/flow.conf`, env)
          delete data.properties.variables
        }

        const t = await sequelize.transaction()
        try {
          await db.PROCESSES.PROCESS.update({ active: false }, {
            where: {
              id
            },
            transaction: t
          })
          data.properties.version = processInfo.version + 1
          await db.PROCESSES.PROCESS_HISTORY.create({
            idProcess: processInfo.id,
            data: processInfo.data,
            version: processInfo.version,
            createdUser: session.id
          }, { transaction: t })
          await db.PROCESSES.PROCESS.update({
            data,
            version: processInfo.version + 1,
            image,
            active: true,
            createdUser: session.id
          }, {
            where: {
              id: processInfo.id
            },
            transaction: t
          })
          await t.commit()
          // Guardando Variables
          this.variables().save({ idProcess: id, env, createdUser: session.id })
        } catch (error) {
          await t.rollback()
        }

        fs.writeFileSync(`./_processes/${idProcess}.${namespace}.${name}/${name}.flow`, JSON.stringify(data))

        return { name, version: data.properties.version }
      }
    },
    /**
     * VARIABLES
     * @returns
     */
    variables () {
      return {
        async all () {
          return db.PROCESSES.PROCESS_ENV.findAll({
            include: [
              {
                attributes: ['id', 'name'],
                model: db.PROCESSES.PROCESS,
                required: true,
                include: [{
                  attributes: ['name'],
                  model: db.PROCESSES.PROCESS_NAMESPACES,
                  required: true
                }]
              }
            ],
            where: {
              active: true
            }
          })
        },
        async get ({ idFlow }) {
          // Buscando variable entre todos los flows
          const flowName = await glob(`./_processes/${idFlow}.*`)
          // console.log(this.context.properties)
          const path = `./_processes/${flowName}/flow.conf`
          if (fs.existsSync(path)) {
            const data = JSON.parse(fs.readFileSync(`${path}`, 'utf-8'))
            const variables = {}
            if (data) {
              Object.entries(data).forEach(([key, value]) => {
                variables[key] = value
              })
            }
            return variables
          }
          return {}
        },
        async save ({ idProcess, env, createdUser }) {
          const process = await db.PROCESSES.PROCESS.findOne({
            attributes: ['name'],
            include: [{
              model: db.PROCESSES.PROCESS_NAMESPACES,
              required: true
            }],
            where: { id: idProcess }
          })
          if (process) {
            fs.writeFileSync(`./_processes/${idProcess}.${process.process_namespace.name}.${process.name}/flow.conf`, env)
          }
          return db.PROCESSES.PROCESS_ENV.upsert({ idProcess, env, active: true, createdUser }, { where: idProcess })
        }
      }
    },
    /**
     * DEPLOY
     * @returns load
     * flow/deploy
     */
    deploy () {
      return {
        // flow/deploy/load
        async list ({ reload = false } = {}) {
          if (listDeploy && !reload) return listDeploy
          listDeploy = await db.PROCESSES.PROCESS_DEPLOY.findAll({
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
            order: [
              ['name', 'asc']
            ]
          })
          return listDeploy
        },
        // flow/deploy/new
        async new ({ name, type, url, namespace, token, dir, primaryBranch, branches, deployBranch, session }) {
          const infoDeploy = await db.PROCESSES.PROCESS_DEPLOY.create({
            name, type, url, namespace, token, dir, primaryBranch, branches, deployBranch, active: true, createdUser: session.id
          })
          await this.load({ reload: true })
          return infoDeploy
        }
      }
    },
    /**
     * load
     * @returns
     */
    namespace () {
      return appProcessNamespace()
    }
  }
}
