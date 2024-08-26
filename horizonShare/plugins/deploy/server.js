export function fields () {
  return {
    properties: {
      icon: 'mdi-server'
    },
    elements: {
      ip: {
        label: 'Ip del servidor',
        type: 'string',
        size: 2,
        required: true
      },
      idGroup: {
        label: 'Id del grupo',
        type: 'string',
        size: 2,
        required: true
      },
      branches: {
        label: 'Lista de ramas',
        type: 'tags',
        value: [],
        required: true,
        size: 2
      },

      primaryBranch: {
        label: 'Rama principal',
        type: 'string',
        required: true,
        size: 1
      },
      deployBranch: {
        label: 'Rama de despliegue',
        type: 'string',
        required: true,
        size: 1
      }
    }
  }
}
