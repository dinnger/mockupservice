export function fields () {
  return {
    properties: {
      icon: 'mdi-gitlab'
    },
    elements: {
      url: {
        label: 'URL',
        type: 'string',
        required: true,
        size: 3
      },
      idGroup: {
        label: 'Id del grupo',
        type: 'string',
        required: true,
        size: 1
      },
      branches: {
        label: 'Lista de ramas',
        type: 'tags',
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
      },
      file: {
        label: 'Archivo de despliegue',
        type: 'file',
        required: true,
        size: 4
      }
    }
  }
}
