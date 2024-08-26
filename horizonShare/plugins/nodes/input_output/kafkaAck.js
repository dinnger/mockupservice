export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // ===============================================
  constructor () {
    this.title = 'Kafka Ack'
    this.desc = 'Confirma mensajes de un tópico de Kafka'
    this.icon = '󱀏'
    this.group = 'Kafka'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      ack: {
        label: 'Ack:',
        value: true,
        type: 'switch',
        description: 'Habilita la confirmación del mensaje, si no se confirma el mensaje se pierde (nack)',
        size: 1
      }
    }
  }

  async onExecute ({ inputData, outputData, context }) {
    try {
      const node = context.getNodeByType('triggers/rabbit')
      if (!node) return outputData('error', { error: 'No se ha definido el nodo' })

      const channel = node.meta.channel
      const message = node.meta.message
      if (!channel || !message) return outputData('error', { error: 'No se ha definido el canal o mensaje' })

      if (this.properties.ack.value) {
        channel.ack(message)
      } else {
        channel.nack(message)
      }
      outputData('response', inputData.data)
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
