import { Op, db, sequelize } from '../database/connect.js'
import appFlowNamespace from './appFlowNamespace.js'
import appFlowNode from './appFlowNode.js'
import appFlowDeploy from './appFlowDeploy.js'
import appFlowDoc from './appFlowDoc.js'
import fs from 'fs'
import { glob } from 'glob'

export default function flow ({ isTemplate = false } = {}) {
  return {
    /**
     * infoFlow
     * @param {*} param0
     * @returns
    */
    //  flow/infoFlow
    async infoFlow ({ id, attributes = ['id', 'idNamespace', 'name', 'description', 'version', 'flow', 'active', 'isPrivate', 'privacy', 'createdAt'], session }) {
      const data = await db.FLOWS.FLOW.findOne({
        attributes: [...attributes, 'ownerUser'],
        include: [
          {
            attributes: [['name', 'namespace'], 'idDeploy', 'active'],
            model: db.FLOWS.FLOW_NAMESPACES,
            required: true

          },
          {
            attributes: ['config'],
            model: db.FLOWS.FLOW_ENV,
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
          active: true,
          isTemplate
        }
      })

      // agregar informacion de privacidad
      if (data && session?.id) {
        const validUserPermission = session.permissions && session.permissions.find(f => f === 'flujo_admin')
        data.dataValues.privacyInfo = {
          isOwner: data.ownerUser === session.id,
          isAdmin: !!validUserPermission,
          existUser: !!(data.privacy?.users && data.privacy.users.find(f => f === session.alias)),
          permission: data.privacy?.permissions
        }
      }

      return data
    },
    /**
     * get
     * @param {*} param0
     * @returns
     */
    async get ({ filter, image = true, session } = {}) {
      const attributes = ['id', 'idNamespace', 'name', 'description', 'version', 'flow', 'isPrivate', 'privacy', 'createdAt', 'ownerUser']
      const where = {
        active: true
      }
      if (image) attributes.push('image')
      if (filter) {
        where.id = { [Op.in]: filter.map(m => parseInt(m)) }
      }
      if (isTemplate) where.isTemplate = true

      // Si es publico (isPrivate = false) o si es privado y el usuario tiene permisos
      if (session?.id) {
        const validUserPermission = session.permissions && session.permissions.find(f => f === 'flujo_admin')
        if (!validUserPermission) {
          where[Op.or] = [
            { isPrivate: false },
            { isPrivate: null },
            {
              isPrivate: true,
              [Op.or]: [
                sequelize.literal(`privacy -> 'users' @> '["${session.alias}"]' `),
                {
                  createdUser: session?.id || 0
                }
              ]
            }
          ]
        }
      }
      if (isTemplate) where.isTemplate = true

      const data = await db.FLOWS.FLOW.findAll({
        attributes,
        include: [
          {
            attributes: ['name'],
            model: db.FLOWS.FLOW_NAMESPACES,
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
     * list
     * @param {*} param0
     * @returns
     */
    // flow/list
    async list ({ session, filter, image = true }) {
      if (!session) return []
      const arrP = session.permissions || []
      const validCore = (f) => (f.flow_namespace.name[0] !== '_' || (f.flow_namespace.name[0] === '_' && arrP.find(f => f === 'flujo_core')))
      const validNamespace = (f) => {
        return (session.namespaces && session.namespaces.indexOf('*') >= 0) ||
      (session.namespaces && session.namespaces.find(s => s === f.idNamespace.toString()))
      }
      const validProject = (f) => {
        return (session.projects && session.projects.indexOf('*') >= 0) ||
      (session.projects && session.projects.find(s => s === f.id.toString()))
      }

      let list = await this.get({ image, filter, session })
      list = list
        .filter(f =>
          validCore(f) &&
          validNamespace(f) &&
          validProject(f))
        .map(m => {
          return {
            id: m.id,
            idNamespace: m.idNamespace,
            name: m.name,
            description: m.description,
            version: m.version,
            flow_namespace: m.flow_namespace,
            user: m.user,
            image: m.image
          }
        })
      return list
    },

    listDeploy ({ session }) {
      return db.FLOWS.FLOW_DEPLOY_LOCAL.findAll({
        attributes: ['id', 'idFlow', 'commit', 'version', 'active', 'createdUser', 'createdAt'],
        include: [
          {
            attributes: ['id', 'name', 'idNamespace'],
            model: db.FLOWS.FLOW,
            required: true,
            include: [{
              attributes: ['name'],
              model: db.FLOWS.FLOW_NAMESPACES,
              required: true
            }]
          },
          {
            attributes: ['alias'],
            model: db.SECURITY.USERS,
            required: true
          }
        ],
        order: [
          ['idFlow', 'desc'],
          ['version', 'desc']
        ]
      })
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
     * @param {id, name, namespace, data, session, image, reload = true} param0
     * @returns
     */
    // flow/save
    async save ({ id, name, namespace, data, session, image, git, deployParameters, reload = true } = {}) {
      let idFlow = id
      data.properties.latest = true

      // Variables
      let env = ''
      if (data.properties?.variables) {
        env = data.properties.variables
        delete data.properties.variables
      }

      // Nuevo Flujo
      if (!id) {
        data.properties.namespace = namespace
        // Creando espacio de trabajo

        data.properties.version = 1
        const listNamespaces = await appFlowNamespace({ isTemplate }).list({ session })
        const namespaceS = listNamespaces.find(f => f.name.indexOf(namespace) === 0)
        if (!namespaceS) return { error: 'No se encuentra el espacio de trabajo' }
        data.properties.namespace = namespaceS.name
        const where = { name, idNamespace: namespaceS.id }
        if (isTemplate) where.isTemplate = true
        if (await db.FLOWS.FLOW.findOne({ where })) return { error: 'Ya existe un flujo de trabajo con el mismo nombre' }
        const result = await db.FLOWS.FLOW.create({
          idNamespace: namespaceS.id,
          name,
          description: data.properties.description,
          flow: data,
          version: 1,
          active: true,
          image,
          git,
          deployParameters,
          isTemplate,
          createdUser: session.id,
          ownerUser: session.id
        })
        // Guardando Variables
        idFlow = result.id
        if (!isTemplate) {
          if (!fs.existsSync(`./_flows/${idFlow}.${namespace}.${name}`)) fs.mkdirSync(`./_flows/${idFlow}.${namespace}.${name}`)
          this.variables().save({ idFlow: result.id, env, session })
          fs.writeFileSync(`./_flows/${idFlow}.${namespace}.${name}/${name}.flow`, JSON.stringify(data, null, ' '))
        }
        // await this.get({ reload: true, session })
        return result
      } else {
        // si cuenta con id
        const flowInfo = await this.infoFlow({ id })
        // eslint-disable-next-line n/no-callback-literal
        if (!flowInfo) return { error: 'No se encuentra el flujo de trabajo o se encuentra deshabilitado' }
        // eslint-disable-next-line n/no-callback-literal
        if (!flowInfo.flow_namespace.active) return { error: 'No se encuentra el directorio asociado al flujo de trabajo.' }

        namespace = flowInfo.flow_namespace.dataValues.namespace
        name = flowInfo.name
        data.properties.namespace = namespace

        const t = await sequelize.transaction()
        try {
          await db.FLOWS.FLOW.update({ active: false }, {
            where: {
              id
            },
            transaction: t
          })
          data.properties.version = flowInfo.version + 1
          await db.FLOWS.FLOW_HISTORY.create({
            idFlow: flowInfo.id,
            flowData: flowInfo.flow,
            version: flowInfo.version,
            createdUser: session.id
          }, { transaction: t })
          await db.FLOWS.FLOW.update({
            flow: data,
            version: flowInfo.version + 1,
            image,
            git,
            active: true,
            deployParameters,
            createdUser: session.id
          }, {
            where: {
              id: flowInfo.id
            },
            transaction: t
          })
          await t.commit()
          // Guardando Variables
          this.variables().save({ idFlow: id, env, session })
        } catch (error) {
          await t.rollback()
        }

        fs.writeFileSync(`./_flows/${idFlow}.${namespace}.${name}/${name}.flow`, JSON.stringify(data, null, ' '))

        return { name, version: data.properties.version }
      }
    },
    // flow/history
    async history ({ idFlow }) {
      return {
        async list () {
          try {
            return await db.FLOWS.FLOW_HISTORY.findAll({
              attributes: ['id', 'version', 'createdAt'],
              include: [
                {
                  attributes: ['alias'],
                  model: db.SECURITY.USERS,
                  required: true
                }
              ],
              where: {
                idFlow
              },
              order: [
                ['version', 'desc']
              ]
            })
          } catch (error) {
            return []
          }
        },
        detail ({ idFlow, version }) {
          try {
            return db.FLOWS.FLOW_HISTORY.findOne({
              attributes: ['flowData'],
              where: {
                idFlow,
                version
              }
            })
          } catch (error) {
            return null
          }
        }
      }
    },
    // flow/move
    async move ({ id, idNamespace }) {
      const namespace = await db.FLOWS.FLOW_NAMESPACES.findOne({
        where: {
          id: idNamespace
        }
      })

      const data = await db.FLOWS.FLOW.findOne({
        where: {
          id
        }
      })
      // Validando que no exista el flujo con el mismo nombre
      const exist = await db.FLOWS.FLOW.findOne({
        where: {
          name: data.name,
          idNamespace,
          active: true
        }
      })
      if (exist) return { error: 'Ya existe un flujo con el mismo nombre' }

      data.set({ idNamespace })
      data.set({ 'flow.properties.namespace': namespace.name })
      return await data.save()
    },
    // flow/copy
    async copy ({ id, name, idNamespace }) {
      const namespace = await db.FLOWS.FLOW_NAMESPACES.findOne({
        where: {
          id: idNamespace
        }
      })
      const data = await db.FLOWS.FLOW.findOne({
        where: {
          id
        },
        raw: true
      })

      // Validando que no exista el flujo con el mismo nombre
      const exist = await db.FLOWS.FLOW.findOne({
        where: {
          name,
          idNamespace,
          active: true
        }
      })
      if (exist) return { error: 'Ya existe un flujo con el mismo nombre' }
      delete data.id
      data.name = name
      data.idNamespace = idNamespace
      data.flow.properties.namespace = namespace.name
      const newFlow = await db.FLOWS.FLOW.create(data)
      if (!fs.existsSync(`./_flows/${newFlow.id}.${namespace.name}.${name}/`)) fs.mkdirSync(`./_flows/${newFlow.id}.${namespace.name}.${name}/`)
      fs.writeFileSync(`./_flows/${newFlow.id}.${namespace.name}.${name}/${name}.flow`, JSON.stringify(data.flow))
      return newFlow.id
    },
    // flow/delete
    async delete ({ id }) {
      return db.FLOWS.FLOW.update({
        active: false
      }, {
        where: {
          id
        }
      })
    },
    // flow/privacy
    privacy () {
      return {
        // flow/privacy/save
        async save ({ idFlow, isPrivate, permissions, users }) {
          try {
            return await db.FLOWS.FLOW.update({
              isPrivate,
              privacy: {
                permissions,
                users
              }
            }, {
              where: {
                id: idFlow
              }
            })
          } catch (error) {
            return { error: error.toString() }
          }
        }
      }
    },
    /**
     * VARIABLES
     * @returns
     */
    variables () {
      return {
        async all () {
          return db.FLOWS.FLOW_ENV.findAll({
            include: [
              {
                attributes: ['id', 'name'],
                model: db.FLOWS.FLOW,
                required: true,
                where: {
                  active: true
                },
                include: [{
                  attributes: ['name'],
                  model: db.FLOWS.FLOW_NAMESPACES,
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
          const flowName = await glob(`./_flows/${idFlow}.*`)
          // console.log(this.context.properties)
          const path = `./_flows/${flowName}/flow.conf`
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
        async save ({ idFlow, env, session }) {
          const flow = await db.FLOWS.FLOW.findOne({
            attributes: ['name'],
            include: [{
              model: db.FLOWS.FLOW_NAMESPACES,
              required: true
            }],
            where: { id: idFlow }
          })
          if (flow) {
            fs.writeFileSync(`./_flows/${idFlow}.${flow.flow_namespace.name}.${flow.name}/flow.conf`, JSON.stringify(env, null, ' '))
          }

          return db.FLOWS.FLOW_ENV.upsert({ idFlow, config: env, active: true, createdUser: session.id }, { where: idFlow })
        }
      }
    },

    /**
     * TEMPLATE
     * @returns
     */
    template () {
      return flow({ isTemplate: true })
    },

    /**
     * DOCUMENTATION
     * @returns
     */
    documentation () {
      return appFlowDoc()
    },
    /**
     * DEPLOY
     * @returns load
     * flow/deploy
     */
    deploy () {
      return appFlowDeploy()
    },
    namespace () {
      return appFlowNamespace({ isTemplate })
    },
    nodes () {
      return appFlowNode()
    }
  }
}
