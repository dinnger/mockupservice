export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk amqplib
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'RabbitMQ Consumer'
    this.desc = 'Consume mensajes de un tópico de RabbitMQ'
    this.icon = '󰤇'
    this.group = 'Triggers'
    this.color = '#3498DB'
    this.isTrigger = true

    // this.isTrigger = true // Define si es un nodo trigger
    this.addInput('init')
    this.addOutput('response')
    this.addOutput('error')
    this.addOutput('error:connection')

    this.ref = ref
    this.watch = watch

    this.properties = {
      url: {
        label: 'URL:',
        value: 'amqp://localhost:5672',
        type: 'string',
        size: 4
      },
      divider1: {
        label: 'Configuración de Exchange',
        type: 'divider'
      },
      exchange: {
        label: 'Exchange:',
        value: '',
        type: 'string',
        description: 'Nombre del Exchange, si no se define se usa el nombre de la cola',
        size: 2
      },
      exchangeType: {
        label: 'Tipo de Exchange:',
        value: 'topic',
        type: 'options',
        options: [{
          label: 'Direct',
          value: 'direct'
        }, {
          label: 'Fanout',
          value: 'fanout'
        }, {
          label: 'Topic',
          value: 'topic'
        }],
        size: 1
      },
      routingKey: {
        label: 'Routing Key:',
        value: '',
        type: 'string',
        description: 'Nombre del routing key, si no se define se usa el nombre de la cola',
        size: 1
      },
      divider2: {
        label: 'Configuración de Colas',
        type: 'divider'
      },
      queue: {
        label: 'Cola (Queue):',
        value: '',
        type: 'string',
        description: 'Nombre de la cola'
      },
      divider3: {
        label: 'Opciones',
        type: 'divider'
      },
      retry: {
        label: 'Reintento (seg):',
        value: 10,
        description: 'Tiempo máximo de espera para reintentar una conexión (Cada reintento se tomara el doble de tiempo de la anterior)',
        type: 'number',
        size: 1
      },
      durable: {
        label: 'Durable:',
        value: true,
        type: 'switch',
        description: 'Habilita la durabilidad de la cola',
        size: 1
      },
      persistent: {
        label: 'Persistent:',
        value: true,
        type: 'switch',
        description: 'Habilita la persistencia del mensaje',
        size: 1
      },
      autoAck: {
        label: 'Auto Ack:',
        value: true,
        description: 'Habilitar commit automático, si es falso se debe hacer manualmente mediante la entrada "next"',
        type: 'switch',
        size: 1
      }
    }
  }

  async onExecute ({ inputData, outputData, context }) {
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
      const { retryAsync } = await import('../../../utils/persistent.js')
      const amqp = require('amqplib')
      const queue = this.properties.queue.value
      const durable = this.properties.durable.value

      const fnRetry = retryAsync({ maxTime: this.properties.retry.value || 10 })

      const exec = async () => {
        const conn = await amqp.connect(this.properties.url.value)
        const channel = await conn.createChannel()
        await channel.prefetch(1)

        await channel.on('error', () => {})

        await channel.on('close', () => { main() })

        await channel.assertQueue(queue, { durable })

        // Bind the queue to the exchange
        if (this.properties.exchange.value !== '') {
          await channel.assertExchange(this.properties.exchange.value, this.properties.exchangeType.value, { durable })
          await channel.bindQueue(queue, this.properties.exchange.value, this.properties.routingKey.value || '')

          // Start consuming
          channel.consume(queue, (message) => {
            outputData('response', { value: convertJson(message.content.toString()) }, { channel, message })
            if (this.properties.autoAck.value) channel.ack(message)
          }, { noAck: false })
        } else {
          channel.consume(queue, (message) => {
            outputData('response', { value: convertJson(message.content.toString()) }, { channel, message })
            if (this.properties.autoAck.value) channel.ack(message)
          }, { noAck: false })
        }
      }
      const main = async () => {
        fnRetry({
          fn: exec,
          // onSuccess: () => outputData('response', { message: 'Ok' }),
          onError: () => outputData('error', { error: 'Error consuming message' }),
          onErrorEnd: () => outputData('error:connection', { error: 'Error consuming message end' })
        })
      }
      main()
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
