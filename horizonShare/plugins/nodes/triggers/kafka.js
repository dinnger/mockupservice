export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk kafkajs
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Kafka Consumer'
    this.desc = 'Consume mensajes de un tópico de Kafka'
    this.icon = '󱀏'
    this.group = 'Triggers'
    this.color = '#3498DB'

    this.isTrigger = true // Define si es un nodo trigger
    this.addInput('init')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

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
        size: 1
      },
      autoCommit: {
        label: 'Auto Commit:',
        value: true,
        description: 'Habilitar commit automático, si es falso se debe hacer manualmente mediante la entrada "next"',
        type: 'switch',
        size: 1
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
      }
    }
  }

  onCreate ({ context }) {
    this.properties.autoCommit.value = this.ref(this.properties.autoCommit.value)
    this.watch(() => this.properties.autoCommit.value, value => {
      this.interfaz.inputs = []
      this.interfaz.inputs.push('init')
      if (!value.value) this.interfaz.inputs.push('next')
    },
    { deep: true })
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
      // Si se llama a next se debe hacer commit manual
      if (inputData.input === 'next') {
        const next = context.getValue({ obj: 'next' })
        if (!next) return outputData('error', { error: 'No se ha definido la función "next"' })
        next()
        return
      }

      const { Kafka } = require('kafkajs')
      const config = {
        ...convertJson(this.properties.config.value),
        brokers: this.properties.brokers.value.map(m => m.broker.value)
      }
      const kafka = new Kafka(config)
      const consumer = kafka.consumer({ groupId: this.properties.groupId.value })
      // Consuming
      await consumer.connect()
      await consumer.subscribe({ topic: this.properties.topic.value, fromBeginning: true })

      // await consumer.run({
      //   autoCommit: false,
      //   eachMessage: async ({ topic, partition, message, heartbeat }) => {
      //     outputData('response', {
      //       partition,
      //       offset: message.offset,
      //       value: convertJson(message.value.toString())
      //     })
      //     consumer.pause([{ topic, partitions: [partition] }])
      //     setTimeout(() => {
      //       console.log('resume'); consumer.resume([{ topic }])
      //     }, 500)
      //   }
      // })
      const autoCommit = this.properties.autoCommit.value
      await consumer.run({
        autoCommit,
        eachBatchAutoResolve: autoCommit,
        eachBatch: async ({ commitOffsetsIfNecessary, batch, partition, resolveOffset, heartbeat, isRunning, isStale }) => {
          for (const message of batch.messages) {
            if (!isRunning() || isStale()) break
            outputData('response', {
              partition,
              offset: message.offset,
              value: convertJson(message.value.toString())
            })

            if (!autoCommit) {
              await new Promise(resolve => {
                context.setValue({
                  obj: 'next',
                  value: async () => {
                    resolve(true)
                  }
                })
              })
              await resolveOffset(message.offset)
              await commitOffsetsIfNecessary(message.offset)
              await heartbeat()
            }
          }
        }
      })
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
