export default class {
  constructor ({ ref, watch }) {
    this.title = 'Sub Flujo'
    this.desc = 'Permite enlazar un flujo existente'
    this.icon = '󱘖'
    this.ref = ref
    this.watch = watch
    this.isTrigger = true

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.properties = {
      flow: {
        label: 'Seleccionar flujo:',
        type: 'options',
        options: [],
        value: ''
      },
      node: {
        label: 'Seleccionar nodo:',
        type: 'options',
        options: [],
        value: ''
      },
      data: {
        label: 'Datos a enviar',
        type: 'code',
        lang: ['json', 'JSON'],
        value: '{{input.data}}'
      }
    }
  }

  async onCreate ({ context }) {
    const reloadNodes = async (idFlow) => {
      const nodes = await context.fnExternal.getFlowsNodes({ idFlow, type: 'triggers/init' })
      this.properties.node.options.value = nodes.map(m => {
        return {
          label: m.title,
          value: m.id
        }
      })
    }
    this.properties.flow.options = this.ref(this.properties.flow.options)
    this.properties.node.options = this.ref(this.properties.node.options)
    this.properties.flow.value = this.ref(this.properties.flow.value)
    this.properties.node.value = this.ref(this.properties.node.value)

    const arr = await context.fnExternal.getFlowsList()
    this.properties.flow.options.value = arr.map(m => {
      return {
        label: m.namespace.replace(/\./g, '/') + '/' + m.name,
        value: m.id
      }
    })
    if (this.properties.flow.value.value) reloadNodes(this.properties.flow.value.value)
    this.watch(this.properties.flow.value, async (value) => {
      this.properties.node.value.value = null
      reloadNodes(value)
    })
  }

  async onExecute ({ inputData, context, outputData }) {
    try {
      const idSubFlow = this.properties.flow.value
      const idNode = this.properties.node.value

      const convertToJson = (text) => {
        try {
          return JSON.parse(text)
        } catch (error) {
          return text
        }
      }

      // Ejecutando de subflujo
      context.subFlow({
        idFlow: context.properties.value.id,
        idSubFlow,
        idNode,
        data: convertToJson(this.properties.data.value),
        outputData,
        outputDefault: 'response'
      })
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
