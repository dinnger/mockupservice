export default class {
  constructor () {
    this.title = 'Notificación de Formulario'
    this.desc = 'Envía una notificación al cliente'
    this.icon = '󰗖'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      // propiedadad content type
      notify: {
        label: 'Tipo:',
        type: 'options',
        value: 'info',
        options: [
          {
            label: 'Error',
            value: 'error'
          },
          {
            label: 'Info',
            value: 'info'
          },
          {
            label: 'Success',
            value: 'success'
          },
          {
            label: 'Warning',
            value: 'warning'
          }
        ]
      },
      title: {
        label: 'Título:',
        type: 'string',
        value: ''
      },
      message: {
        label: 'Mensaje:',
        type: 'string',
        value: ''
      }
    }
  }

  onExecute ({ inputData, context, outputData }) {
    let node = null
    node = context.getNodeByType('form/form')

    try {
      if (node?.meta?.socket) {
        // validación de mensaje de notificación si es un array
        const message = (typeof this.properties.message.value === 'object' && Array.isArray(this.properties.message.value))
          ? this.properties.message.value.join('\n')
          : this.properties.message.value
        node.meta.socket.emit('notify', { title: this.properties.title.value, message, type: this.properties.notify.value })
      }
      return outputData('response', inputData.data)
    } catch (error) {
      context.logger.error({ responseTime: this.meta.accumulativeTime }, error.toString())
      if (node?.meta?.res) node.meta.res.status(500).send('Error en respuesta ')
      return outputData('error', { statusCode: 500, error })
    }
  }
}
