export default class {
  constructor ({ ref, watch }) {
    this.title = 'Condicional'
    this.desc = 'Permite realizar una validación de datos de entrada'
    this.icon = '󱡷'
    this.group = 'Procesamiento'
    this.color = '#F39C12'

    this.addInput('input')
    this.addOutput('else')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      options: {
        label: 'Condicionales:',
        type: 'list',
        object: {
          where: {
            label: 'Condición',
            type: 'string',
            value: ''
          }
        },
        value: []
      }
    }
  }

  onCreate ({ context }) {
    this.properties.options.value = this.ref(this.properties.options.value)
    this.watch(() => this.properties.options.value.value, value => {
      this.interfaz.outputs = []
      value.forEach((item, index) => {
        this.interfaz.outputs.push(`condición_${index + 1}`)
      })
      this.interfaz.outputs.push('else')
      this.interfaz.outputs.push('error')
    },
    { deep: true })
  }

  async onExecute ({ inputData, outputData }) {
    try {
      let valid = null
      let validGlobal = false
      valid = false
      this.properties.options.value.forEach((conditional, index) => {
        // eslint-disable-next-line no-eval
        eval(`valid = ${conditional.where.value}`)
        if (valid) {
          validGlobal = true
          return outputData('condición_' + (index + 1), inputData.data)
        }
      })
      // console.log(valid)
      if (!validGlobal) outputData('else', inputData.data)
    } catch (error) {
      outputData('error', error.toString())
    }
  }
}
