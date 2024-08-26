export default class {
  constructor () {
    this.title = 'Consumidor Socket'
    this.desc = 'Permite consumir un socket'
    this.icon = '󱉈'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      consumer: {
        label: 'Evento a escuchar:',
        type: 'string',
        value: ''
      }
    }
  }

  async onExecute ({ server, serverInstance, files, context, outputData }) {
    const node = context.getNodeByType('input_output/socket')
    if (!node) return outputData('error', { error: 'No se encontró el nodo socket' })
    const type = node.meta.type
    try {
      const socket = node.meta.socket
      if (type === 'websocket') {
        socket.on(this.properties.consumer.value, (value) => {
          outputData('response', value)
        })
      } else if (type === 'tcp') {
        socket.on('data', (value) => {
          outputData('response', value.toString())
        })
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
