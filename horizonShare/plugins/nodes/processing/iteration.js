export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // ===============================================
  constructor () {
    this.title = 'Iteración'
    this.desc = 'Procesa elemento a elemento de una lista.'
    this.icon = '󱖈'
    this.group = 'Procesamiento'
    this.color = '#F39C12'
    this.addInput('input')
    this.addInput('add')
    this.addInput('next')
    this.addOutput('response')
    this.addOutput('finish')
    this.addOutput('error')
    this.properties = {
      type: {
        label: 'Tipo avance de iteración:',
        type: 'options',
        options: [
          {
            label: 'Manual',
            value: 'manual'
          },
          {
            label: 'Temporizado',
            value: 'delay'
          }
        ],
        value: 'manual'
      },
      valor: {
        label: 'Valor de la iteración:',
        type: 'code',
        lang: ['json', 'JSON'],
        value: ''
      },
      // La propiedad isTrigger permite indicar si es un nodo que se ejecuta al inicio de un flujo
      isTrigger: {
        label: 'Trazar registros de salida:',
        description: 'Permite al nodo crear registros de salida individuales por cada ejecución. Si está desactivado, el nodo solo tomara el primer registro de salida.',
        type: 'switch',
        show: false,
        value: true
      }
    }
  }

  async onExecute ({ inputData, execution, context, outputData }) {
    try {
      let valorInput = []
      try {
        valorInput = typeof this.properties.valor.value === 'object' && Array.isArray(this.properties.valor.value) ? this.properties.valor.value : JSON.parse(this.properties.valor.value)
      } catch (error) {}

      if (inputData.input === 'input' && valorInput.length === 0 && Array.isArray(inputData?.data)) valorInput = inputData.data

      if (!Array.isArray(valorInput)) return outputData('error', { error: 'El input debe ser un listado (Array)' })

      let next = context.getValue({ obj: 'next' })
      let add = context.getValue({ obj: 'add' })

      const loadFunction = () => {
        context.setValue({ obj: 'index', value: 0 })
        context.setValue({ obj: 'status', value: 'finish' })
        context.setValue({
          obj: 'next',
          value: () => {
            if (valorInput.length === 0) {
              context.setValue({ obj: 'status', value: 'finish' })
              return outputData('finish', valorInput)
            }
            context.setValue({ obj: 'index', value: context.getValue({ obj: 'index' }) + 1 })
            context.setValue({ obj: 'status', value: 'active' })
            return outputData('response', { index: context.getValue({ obj: 'index' }), value: valorInput.shift() })
          }
        })
        context.setValue({
          obj: 'add',
          value: (value) => {
            const status = context.getValue({ obj: 'status' })
            valorInput.push(value)
            if (status === 'finish') {
              context.setValue({ obj: 'status', value: 'active' })
              return outputData('response', { index: context.getValue({ obj: 'index' }) || 0, value: valorInput.shift() })
            }
          }
        })
      }

      if (!next) {
        loadFunction()
        next = context.getValue({ obj: 'next' })
        add = context.getValue({ obj: 'add' })
      }

      if (inputData.input === 'next' && next) return next()
      if (inputData.input === 'add' && add) return add(inputData.data)
      if (inputData.input === 'input') {
        loadFunction()
        return outputData('response', { index: context.getValue({ obj: 'index' }) || 0, value: valorInput.shift() })
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
