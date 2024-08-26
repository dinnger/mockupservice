export default class {
  constructor () {
    this.title = 'Request'
    this.desc = 'Realiza peticiones REST'
    this.icon = '󱌑'
    this.pos = { w: 380, h: 130 }
    this.scope = ['axios']
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.properties = {
      type: {
        label: 'Tipo de llamada:',
        type: 'options',
        options: [{
          label: 'GET',
          value: 'get'
        }, {
          label: 'POST',
          value: 'post'
        }, {
          label: 'PUT',
          value: 'put'
        }, {
          label: 'DELETE',
          value: 'delete'
        }],
        value: 'get'
      },
      url: {
        label: 'Dirección URL:',
        type: 'string',
        value: ''
      },
      contentType: {
        label: 'Content Type:',
        type: 'string',
        value: 'application/json'
      },
      headers: {
        label: 'Headers',
        type: 'code',
        lang: ['json', 'Json'],
        value: '{\n}'
      },
      body: {
        label: 'Body',
        type: 'code',
        lang: ['json', 'Json'],
        value: '{\n}'
      }
    }
  }

  async onExecute ({ outputData, scope }) {
    const axios = await scope.axios
    try {
      // console.log(this.properties.headers.value)
      const config = {
        method: this.properties.type.value,
        maxBodyLength: Infinity,
        url: this.properties.url.value,
        headers: {
          ...this.properties.headers.value.trim() === '' ? {} : typeof this.properties.headers.value === 'string' ? JSON.parse(this.properties.headers.value) : this.properties.headers.value,
          'Content-Type': this.properties.contentType.value
        },
        data: null
      }

      const body = `config.data = ${typeof this.properties.body.value === 'object' ? JSON.stringify(this.properties.body.value) : '`' + this.properties.body.value + '`'}`
      // eslint-disable-next-line no-eval
      eval(body)
      axios.request(config)
        .then((response) => {
          outputData('response', response.data)
        })
        .catch((error) => {
          outputData('error', { error: error.toString() })
        })
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
