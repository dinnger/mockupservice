export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk amqplib
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'RabbitMQ Producer'
    this.desc = 'Produce mensajes de un tópico de RabbitMQ'
    this.icon = '󰤇'
    this.group = 'RabbitMQ'
    this.color = '#3498DB'
    this.isTrigger = true

    // this.isTrigger = true // Define si es un nodo trigger
    this.addInput('init')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      url: {
        label: 'URL:',
        value: 'amqp://localhost:5672',
        type: 'string',
        size: 4
      },
      queue: {
        label: 'Cola (Queue):',
        value: '',
        type: 'string',
        size: 4
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
      value: {
        label: 'Value:',
        value: JSON.stringify({ data: 'Hello World' }, null, ' '),
        type: 'code',
        lang: ['json', 'json'],
        size: 4
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
      const amqp = require('amqplib')
      const queue = this.properties.queue.value
      const durable = this.properties.durable.value
      const persistent = this.properties.persistent.value
      const message = Buffer.from(JSON.stringify(convertJson(this.properties.value.value)))

      const conn = await amqp.connect(this.properties.url.value)
      // Create a channel
      const channel = await conn.createChannel()

      channel.on('error', () => {})

      channel.on('close', () => {})

      // Create a queue
      if (this.properties.exchange.value !== '') {
        await channel.assertExchange(this.properties.exchange.value, this.properties.exchangeType.value, { durable })
        const sent = await channel.publish(this.properties.exchange.value, this.properties.routingKey.value || '', message, { persistent })
        if (!sent) return outputData('error', { error: 'Error sending message' })
        outputData('response', { message: 'Ok' })
      } else {
        await channel.assertQueue(queue, { durable })
        // Bind the queue to the exchange
        const sent = await channel.sendToQueue(queue, message, { persistent })
        if (!sent) return outputData('error', { error: 'Error sending message' })
        outputData('response', { message: 'Ok' })
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
