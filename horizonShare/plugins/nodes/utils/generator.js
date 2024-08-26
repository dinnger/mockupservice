export default class {
  constructor ({ ref, watch }) {
    this.title = 'Generator'
    this.desc = 'Generador de valores'
    this.icon = '󱁤'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.ref = ref
    this.watch = watch
    this.properties = {
      type: {
        label: 'Tipo de utilidad:',
        type: 'options',
        options: [
          {
            label: 'Generador UUID',
            value: 'uuid'
          }, {
            label: 'Valores Random',
            value: 'random'
          },
          {
            label: 'Fecha/Hora',
            value: 'timestamp'
          }
        ],
        value: ''
      },
      min: {
        label: 'Valor Mínimo',
        type: 'number',
        show: ref(false),
        value: 0
      },
      max: {
        label: 'Valor Máximo',
        type: 'number',
        show: ref(false),
        value: 0
      }
    }
  }

  onCreate ({ context }) {
    this.properties.type.value = this.ref(this.properties.type.value)

    const update = () => {
      this.properties.min.show.value = false
      this.properties.max.show.value = false

      if (this.properties.type.value.value === 'random') {
        this.properties.min.show.value = true
        this.properties.max.show.value = true
      }
    }
    this.watch(this.properties.type.value, (value) => {
      update()
    })
    update()
  }

  async onExecute ({ outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    if (this.properties.type.value === 'uuid') {
      const { v4: uuidv4 } = require('uuid')
      return outputData('response', uuidv4())
    }
    if (this.properties.type.value === 'random') {
      const min = this.properties.min.value
      const max = this.properties.max.value
      const random = Math.floor(Math.random() * (max - min) + min)
      return outputData('response', random)
    }
    if (this.properties.type.value === 'timestamp') {
      const ahora = new Date()

      const año = ahora.getFullYear()
      const mes = String(ahora.getMonth() + 1).padStart(2, '0') // Se suma 1 al mes porque en JavaScript los meses van de 0 a 11.
      const dia = String(ahora.getDate()).padStart(2, '0')
      const horas = String(ahora.getHours()).padStart(2, '0')
      const minutos = String(ahora.getMinutes()).padStart(2, '0')
      const segundos = String(ahora.getSeconds()).padStart(2, '0')

      return outputData('response', `${año}${mes}${dia}${horas}${minutos}${segundos}`)
    }

    outputData('error')
  }
}
