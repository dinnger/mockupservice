import { mime } from './_mimeTypes.js'
import { statusCode } from './_statusCodeTypes.js'
export default class {
  constructor ({ watch, ref }) {
    this.title = 'Response'
    this.desc = 'Devuelve la respuesta de una llamada webhook'
    this.icon = '󰌑'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      // propiedadad content type
      contentType: {
        label: 'Content Type',
        type: 'options',
        description: 'Tipo de contenido de la respuesta',
        value: 'application/json',
        options: mime,
        size: 2,
        disabled: true
      },
      status: {
        label: 'Código:',
        type: 'options',
        value: 200,
        options: statusCode,
        size: 1
      },
      isFile: {
        label: 'Es Archivo:',
        type: 'switch',
        value: false,
        size: 1
      },
      nameFile: {
        label: 'Nombre Archivo (con extensión):',
        type: 'string',
        value: '',
        size: 4,
        show: false
      },
      response: {
        label: 'Respuesta',
        type: 'code',
        lang: ['json', 'Json'],
        value: '{\n}'
      },
      header: {
        label: 'Headers',
        type: 'code',
        lang: ['json', 'Json'],
        value: '{\n}',
        show: true
      }
    }
  }

  onCreate ({ context }) {
    this.properties.isFile.value = this.ref(this.properties.isFile.value)
    this.properties.contentType.value = this.ref(this.properties.contentType.value)
    this.properties.contentType.disabled = this.ref(this.properties.contentType.disabled)
    this.properties.nameFile.show = this.ref(this.properties.nameFile.show)
    this.properties.header.show = this.ref(this.properties.header.show)

    const update = () => {
      this.properties.nameFile.show.value = false
      this.properties.header.show.value = false
      this.properties.contentType.disabled.value = false

      if (this.properties.isFile.value.value) {
        this.properties.nameFile.show.value = true
        this.properties.contentType.value.value = 'application/octet-stream'
        this.properties.contentType.disabled.value = true
      } else {
        this.properties.header.show.value = true
        // this.properties.options.show.value = true
      }
    }
    this.watch(this.properties.isFile.value, (value) => {
      update()
    })
    update()
  }

  onExecute ({ context, outputData }) {
    let node = null
    node = context.getNodeByType('triggers/webhook')
    if (node === null) node = context.getNodeByType('triggers/soap')

    const convertJson = (text) => { try { return JSON.parse(text) } catch (error) { return text } }

    try {
      const ifExecute = context.ifExecute()
      if (!ifExecute) {
        const response = this.properties.response.value
        context.logger.info({ responseTime: this.meta.accumulativeTime }, response)
        // agregar el content type a la respuesta node.meta.res proveniente de express
        const contentType = this.properties.contentType.value
        const headers = convertJson(this.properties.header.value)
        // Omitiendo si es test
        if (!context.isTest) {
          node.meta.res.set('Content-Type', contentType)
          Object.keys(headers).forEach((key) => {
            node.meta.res.set(key, headers[key])
          })
          if (this.properties.isFile.value) {
            node.meta.res.set('Content-Disposition', `attachment; filename="${this.properties.nameFile.value}"`)
          }
          node.meta.res.status(parseInt(this.properties.status.value)).send(response)
        }
        return outputData('response', { statusCode: this.properties.status.value, response, contentType })
      }
    } catch (error) {
      outputData('error', { statusCode: 500, error: error.toString() })
      context.logger.error({ responseTime: this.meta.accumulativeTime }, error.toString())
      if (node?.meta?.res && error.toString().indexOf('ERR_HTTP_HEADERS_SENT') === -1) node.meta.res.status(500).send('Error en respuesta ')
    }
  }
}
