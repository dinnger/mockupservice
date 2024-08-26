export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk kafkajs
  // ===============================================
  constructor () {
    this.title = 'Kafka Producer'
    this.desc = 'Productor kafak'
    this.icon = '󱀏'
    this.group = 'Kafka'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      value: {
        label: 'Valor:',
        value: '',
        type: 'code',
        lang: ['json', 'json'],
        size: 4
      },
      topic: {
        label: 'Tópico:',
        value: '',
        type: 'string',
        size: 3
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

  async onExecute ({ outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const convertJson = (value) => {
      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    }
    try {
      const { Kafka } = require('kafkajs')
      const kafka = new Kafka({
        ...convertJson(this.properties.config.value),
        brokers: this.properties.brokers.value.map(m => m.broker.value)
      })

      const producer = kafka.producer()
      const message = { value: (typeof convertJson(this.properties.value.value) === 'object') ? JSON.stringify(convertJson(this.properties.value.value)) : '{}' }

      await producer.connect()
      const data = await producer.send({
        topic: this.properties.topic.value,
        messages: [
          message
        ]
      })
      outputData('response', data)
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
