export default class {
  constructor () {
    this.title = 'Socket'
    this.desc = 'Permite conectarse a un socket'
    this.icon = '󱉈'
    this.group = 'Triggers'
    this.color = '#3498DB'

    this.addOutput('connect')
    this.addOutput('disconnect')
    this.addOutput('error')
    this.properties = {
      type: {
        label: 'Tipo:',
        type: 'options',
        options: [{
          label: 'Websocket',
          value: 'websocket'
        }, {
          label: 'Socket TCP',
          value: 'tcp'
        }],
        value: 'websocket'
      },
      url: {
        label: 'URL:',
        type: 'string',
        value: ''
      }
    }
  }

  async onExecute ({ server, serverInstance, files, context, outputData }) {
    let ioSocket = null
    try {
      // const { Server } = await import('socket.io')

      if (this.properties.type.value === 'websocket') {
        const { io } = await import('socket.io-client')
        const url = this.properties.url.value.split('/')
        const URL = url[0] + '//' + url[2]
        const PATH_URL = '/' + url.slice(3).join('/')

        ioSocket = io(URL, { path: PATH_URL, reconnectionAttempts: 3 })
        ioSocket.on('connect', async (socket) => {
          // Inicializa los valors del formulario
          outputData('connect', { connect: true }, { socket: ioSocket, type: 'websocket' })
        })
        ioSocket.on('connect_error', (error) => {
          outputData('error', { error: error.toString() })
        })
        ioSocket.on('disconnect', () => {
          outputData('disconnect', { disconnect: true })
        })
      } else if (this.properties.type.value === 'tcp') {
        const net = await import('node:net')
        // Conexión con socket TCP por net
        ioSocket = new net.Socket()
        const host = this.properties.url.value.split(':')[0]
        const port = this.properties.url.value.split(':')[1]
        ioSocket.connect({ host, port })
        ioSocket.on('connect', async () => {
          outputData('connect', { connect: true }, { socket: ioSocket, type: 'tcp' })
        })
        ioSocket.on('error', (error) => {
          outputData('error', { error: error.toString() })
        })
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
