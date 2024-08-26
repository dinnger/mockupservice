export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk kafkajs
  // ===============================================
  constructor () {
    this.title = 'Kafka Kerberos'
    this.desc = 'Consumer kafak'
    this.icon = '󱀏'
    this.group = 'Kafka'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {

      topic: {
        label: 'Tópico:',
        value: '',
        type: 'string',
        size: 2
      },
      groupId: {
        label: 'Id Grupo:',
        value: '',
        type: 'string',
        size: 2
      },
      config: {
        label: 'Configuración:',
        type: 'code',
        value: JSON.stringify({
          clientId: 'my-app',
          sasl: {
            username: '',
            password: '',
            mechanism: 'scram-sha-512'
          },
          ssl: {
            rejectUnauthorized: false
          }
        }, null, ' ')
      },
      brokers: {
        label: 'Brokers:',
        description: 'Urls de conexión',
        type: 'list',
        object: {
          broker: {
            label: 'Broker:',
            type: 'string',
            value: ''
          }
        },
        value: []
      },
      ssl: {
        label: 'Certificado SSL:',
        description: 'Subir archivo .zip con ca.crt, client-key.pem y client-cert.pem',
        type: 'file',
        accept: '.zip',
        unzip: true,
        value: ''
      }
    }
  }

  async onExecute ({ serverInstance, context, outputData }) {
    try {
      console.log('kafka')
      const { Server } = await import('socket.io')
      const base = context.properties.value.config?.router?.base
      const prefix = `/kafka_${context.properties.value.id}`
      const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
      const url = pathUrl + (context.environment.env === 'development' ? prefix : base) + '/' + context.nodes.value[context.idNode].title.toLowerCase().replace(/ /g, '_')
      console.log('KAFKA:', url)
      // const { start } = await import('../../../serverForm/server.js')
      // start({ endpoint: url })
      console.log(serverInstance.port)
      const io = new Server(serverInstance, {
        maxHttpBufferSize: 1e8,
        path: url + '/socket.io',
        cors: {
          credentials: true,
          origin: [url]
        }
      })
      io.on('connection', async (socket) => {
        // Inicializa los valors del formulario
        console.log(socket.id)
        outputData('init', {}, { socket })
        socket.on('client', (value) => {
          console.log(value)
          // outputData(`action:${value.action}`, value.properties || {}, { socket })
        })
        socket.on('disconnect', () => {
          console.log('>>>>>> disconnect', socket.id)
        })
      })
    } catch (error) {
      console.log(error)
      outputData('error', { error: error.toString() })
    }
  }
}
