export function fields () {
  return {
    properties: {
      icon: 'mdi-server'
    },
    elements: {
      name: {
        label: 'Nombre',
        type: 'string',
        required: true,
        suffix: [
          {
            type: 'switch',
            label: 'Configurable',
            buttonLabel: 'Generar',
            icon: 'mdi-refresh',
            value: false
          }
        ]
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
