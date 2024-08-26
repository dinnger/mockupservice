export default class {
  constructor ({ ref, watch }) {
    this.title = 'Ir a'
    this.desc = 'Redirección a una página'
    this.icon = '󱌑'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      type: {
        label: 'Tipo de Redirección',
        type: 'options',
        options: [{
          label: 'Url',
          value: 'url'
        }, {
          label: 'Formulario',
          value: 'form'
        }],
        value: 'url'
      },
      url: {
        label: 'URL:',
        type: 'group',
        value: '',
        object: {
          url: {
            type: 'string',
            value: ''
          }
        },
        show: false
      },
      form: {
        label: 'Formulario:',
        type: 'group',
        value: '',
        object: {
          form: {
            type: 'options',
            options: [],
            value: ''
          }
        },
        show: false
      }
    }
  }

  async onCreate ({ context }) {
    this.properties.type.value = this.ref(this.properties.type.value)
    this.properties.url.show = this.ref(false)
    this.properties.form.show = this.ref(false)
    this.properties.form.object.form.options = this.ref([])

    const update = () => {
      this.properties.url.show.value = false
      this.properties.form.show.value = false

      if (this.properties.type.value.value === 'url') {
        this.properties.url.show.value = true
      }
      if (this.properties.type.value.value === 'form') {
        this.properties.form.show.value = true
        const nodes = Object.entries(context.nodes.value).filter(f => f[1].type === 'form/form').map(m => {
          return {
            label: m[1].title,
            value: m[1].id
          }
        })
        this.properties.form.object.form.options.value = nodes
      }
    }
    this.watch(this.properties.type.value, (value) => {
      console.log(value)
      update()
    })
    update()
  }

  onExecute ({ inputData, context, outputData }) {
    let node = null
    node = context.getNodeByType('form/form')

    try {
      if (this.properties.type.value === 'url') {
        if (node?.meta?.socket) node.meta.socket.emit('redirect', { url: this.properties.url.value })
        return outputData('response', inputData.data)
      }

      if (this.properties.type.value === 'form') {
        const idNode = this.properties.form.value.form.value
        const nodeForm = context.getNodeById({ idNode, onlyExec: false })
        if (nodeForm) {
          const endpoint = nodeForm.properties.endpoint.value
          const base = context.properties.value.config?.router?.base
          const prefix = `/flow_${context.properties.value.id}`
          const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
          const url = pathUrl + (context.environment.env === 'development' ? prefix : base) + endpoint
          if (node?.meta?.socket) node.meta.socket.emit('redirect', { url })
          return outputData('response', inputData.data)
        }
      }
    } catch (error) {
      context.logger.error({ responseTime: this.meta.accumulativeTime }, error.toString())
      if (node?.meta?.res) node.meta.res.status(500).send('Error en respuesta ')
      return outputData('error', { statusCode: 500, error })
    }
  }
}
