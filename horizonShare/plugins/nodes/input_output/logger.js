export default class {
  constructor () {
    this.title = 'Logs'
    this.desc = 'Guarda un registro en logs'
    this.icon = '󰺥'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.properties = {
      type: {
        label: 'Tipo de log:',
        type: 'options',
        options: [{
          label: 'Informativo',
          value: 'info'
        }, {
          label: 'Debug',
          value: 'debug'
        }, {
          label: 'Error',
          value: 'error'
        }],
        value: 'info'
      },
      message: {
        label: 'Respuesta',
        type: 'code',
        // lang: ['json', 'Json'],
        value: ''
      },
      properties: {
        label: 'Propiedades',
        type: 'code',
        lang: ['json', 'Json'],
        value: '{\n}'
      }
    }
  }

  onExecute ({ context, inputData, outputData }) {
    try {
      context.logger[this.properties.type.value](JSON.parse(this.properties.properties.value), this.properties.message.value)
      outputData('response', inputData.data)
      // outputData('response', { status: parseInt(this.properties.status.value) })
    } catch (error) {
      context.logger.error({ responseTime: this.meta.accumulativeTime }, error.toString())
      outputData('error', { error: error.toString() })
    }
  }
}
