export default class {
  constructor () {
    this.title = 'Emisor Socket'
    this.desc = 'Permite emitir datos a un socket'
    this.icon = '󱉈'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      emit: {
        label: 'Evento a emitir:',
        type: 'string',
        value: ''
      },
      value: {
        label: 'Datos a emitir:',
        type: 'code',
        lang: ['json', 'Json'],
        value: ''
      }
    }
  }

  async onExecute ({ server, serverInstance, files, context, outputData }) {
    const node = context.getNodeByType('input_output/socket')
    if (!node) return outputData('error', { error: 'No se encontró el nodo socket' })
    const type = node.meta.type
    try {
      // console.log('socket:', node.meta)
      const socket = node.meta.socket
      if (type === 'websocket') {
        socket.emit(this.properties.emit.value, this.properties.value.value, value => {
          outputData('response', value)
        })
      } else if (type === 'tcp') {
        socket.on('data', (value) => {
          socket.removeAllListeners('data')
          outputData('response', value.toString())
        })
        context.setValue('listener', true)

        socket.write(this.properties.value.value)
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
