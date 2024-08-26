import { Op, db } from '../database/connect.js'

export default function ({ isTemplate = false } = {}) {
  return {
    async list ({ session, all }) {
      // eslint-disable-next-line n/no-callback-literal
      if (!session) return []
      const list = await this.get()
      if (all) return list

      const arrP = session.permissions || []
      const allNamespace = session.namespaces && session.namespaces.indexOf('*') >= 0
      const namespacePermission = !session.namespaces ? [] : list.filter(s => session.namespaces.indexOf(s.id.toString()) >= 0)

      const validCore = (f) => (f.name[0] !== '_' || (f.name[0] === '_' && (f.name[0] !== '_' || (f.name[0] === '_' && arrP.find(f => f === 'flujo_core')))))

      const validNamespace = (f) => {
        if (allNamespace) return true
        const exist = namespacePermission.find(ff => ff.name.indexOf(f.name) === 0)
        return exist
      }

      return list.filter(f => validCore(f) && validNamespace(f))
    },

    /**
     * load - Cargar el listado de namespaces
     * @param {reload} param0
     * @returns
     */
    async get ({ reload = false } = {}) {
      const where = {
        active: true
      }
      if (isTemplate) where.isTemplate = true
      const listNamespaces = await db.FLOWS.FLOW_NAMESPACES.findAll({
        attributes: ['id', 'name', 'createdAt', 'idDeploy', 'idGroup'],
        include: [
          {
            attributes: [['alias', 'owner']],
            model: db.SECURITY.USERS,
            required: true
          }
        ],
        where,
        order: [
          ['name', 'asc']
        ]
      })
      return listNamespaces
    },
    /**
     * delete - Deshabilita el namespace para su visualización y uso
     * @param {id} param0
     */
    async delete ({ id }) {
      const data = await db.FLOWS.FLOW_NAMESPACES.findOne({ where: { id } })
      const update = await db.FLOWS.FLOW_NAMESPACES.update({
        active: false
      }, {
        where: {
          [Op.or]: [
            {
              name: data.name
            },
            {
              name: {
                [Op.iLike]: data.name + '.%'
              }
            }
          ]

        },
        returning: true
      })
      await this.load({ reload: true })
      return update
    },
    /**
     * NEw
     * @param {*} param0
     * @returns
     */
    async new ({ namespace, idDeploy, session }) {
      const Deploy = await import('./appFlowDeploy.js')
      try {
        const whereValid = {
          name: namespace
        }
        if (isTemplate) whereValid.isTemplate = true
        const existNamespace = await db.FLOWS.FLOW_NAMESPACES.findOne({ where: whereValid })
        if (existNamespace) return { error: 'El directorio ya existe' }
        if (namespace.split('.').length > 1) {
          const arr = namespace.split('.')
          arr.pop()
          const name = arr.join('.')
          const where = {
            name
          }
          if (isTemplate) where.isTemplate = true

          const parent = await db.FLOWS.FLOW_NAMESPACES.findOne({
            where
          })
          idDeploy = parent.idDeploy
        }
        await db.FLOWS.FLOW_NAMESPACES.create({
          name: namespace,
          createdUser: session.id,
          idDeploy: (idDeploy || null),
          active: true,
          isTemplate
        })
        await Deploy.default().createGroup({ namespace })
        return true
      } catch (err) {
        return { error: err.toString() }
      }
    }
  }
}
