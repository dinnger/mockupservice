import { Op, db } from '../database/connect.js'

export default function () {
  return {
    async list ({ session, all }) {
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
      const listNamespaces = await db.PROCESSES.PROCESS_NAMESPACES.findAll({
        attributes: ['id', 'name', 'createdAt', 'idDeploy', 'idGroup'],
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
      return listNamespaces
    },
    /**
     * delete - Deshabilita el namespace para su visualización y uso
     * @param {id} param0
     */
    async delete ({ id }) {
      const data = await db.PROCESSES.PROCESS_NAMESPACES.findOne({ where: { id } })
      const update = await db.PROCESSES.PROCESS_NAMESPACES.update({
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
      try {
        const existNamespace = await db.PROCESSES.PROCESS_NAMESPACES.findOne({ where: { name: namespace } })
        if (existNamespace) return { error: 'El directorio ya existe' }
        if (namespace.split('.').length > 1) {
          const arr = namespace.split('.')
          arr.pop()
          const name = arr.join('.')

          const parent = await db.PROCESSES.PROCESS_NAMESPACES.findOne({
            where: {
              name
            }
          })
          idDeploy = parent.idDeploy
        }
        await db.PROCESSES.PROCESS_NAMESPACES.create({
          name: namespace,
          createdUser: session.id,
          idDeploy: idDeploy || null,
          active: true
        })
        this.load({ reload: true })

        return true
      } catch (err) {
        return { error: err.toString() }
      }
    }
  }
}
