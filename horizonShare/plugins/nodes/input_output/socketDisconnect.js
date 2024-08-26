export default class {
  constructor () {
    this.title = 'Emisor Socket'
    this.desc = 'Permite emitir datos a un socket'
    this.icon = '󱉈'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
  }

  async onExecute ({ server, serverInstance, files, context, outputData }) {
    const node = context.getNodeByType('input_output/socket')
    if (!node) return outputData('error', { error: 'No se encontró el nodo socket' })
    const type = node.meta.type
    try {
      // console.log('socket:', node.meta)
      const socket = node.meta.socket
      if (type === 'websocket') {
        socket.disconnect()
        outputData('response', { response: 'Desconectado' })
      } else if (type === 'tcp') {
        socket.destroy()
        outputData('response', { response: 'Desconectado' })
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
