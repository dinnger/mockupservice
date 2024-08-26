export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk fast-xml-parser
  // ===============================================
  #base_url

  constructor ({ ref, watch }) {
    this.title = 'Soap'
    this.desc = 'Llamada Soap'
    this.icon = '󰗀'
    this.group = 'Triggers'
    this.color = '#3498DB'

    this.#base_url = ''
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      url: {
        label: 'URL asignada:',
        type: 'box',
        value: '/'
      },
      endpoint: {
        label: 'Endpoint:',
        type: 'string',
        value: '/'
      },
      wsdlFile: {
        label: 'Archivo wsdl (.zip):',
        type: 'file',
        options: { unzip: true, accept: '.zip' },
        load: ({ files }) => this.load({ el: this, files }),
        value: ''
      },
      wsdlIndex: {
        label: 'Archivo inicial:',
        type: 'options',
        options: [],
        value: ''
      },
      timeout: {
        label: 'Tiempo de espera (seg):',
        type: 'number',
        value: 50
      }
    }
  }

  load ({ el, files }) {
    el.properties.wsdlIndex.options.value = files.map(m => {
      return {
        label: m.name,
        value: m.name
      }
    })
  }

  onCreate ({ context, files }) {
    this.properties.url.value = this.ref(this.properties.url.value)
    this.properties.endpoint.value = this.ref(this.properties.endpoint.value)
    this.properties.wsdlFile.value = this.ref(this.properties.wsdlFile.value)
    this.properties.wsdlIndex.options = this.ref(this.properties.wsdlIndex.options)
    this.properties.wsdlIndex.value = this.ref(this.properties.wsdlIndex.value)

    const update = () => {
      const base = context.properties.value.config?.router?.base
      const prefix = `/${context.properties.value.namespace}.${context.name}`
      const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
      const url = context.environment.base_url + pathUrl + encodeURI((prefix) + this.properties.endpoint.value.value)
      const urlProd = '( HOST )' + encodeURI((base) + this.properties.endpoint.value.value)
      this.properties.url.value.value = `
      <div class="grid" style="grid-template-columns: repeat(6, minmax(0, 1fr));">
        <div class="col-span-1"><strong>Desarrollo:</strong></div>
        <div style="grid-column:span 5 / span 1">${url}</div>
        <div style="grid-column:span 1 / span 1"><strong>Producción:</strong></div>
        <div style="grid-column:span 5 / span 5">${urlProd}</div>
      </div>
      `
    }
    update()
    this.watch(context.properties.value, value => update())
    this.watch(this.properties.endpoint.value, value => update())

    this.watch(this.properties.wsdlFile.value, (value) => {
      // Eliminación del archivo
      if (typeof value === 'string' && value.indexOf('REMOVE') >= 0) {
        files.remove({ path: this.title, fileName: 'wsdl' })
          .then(() => { this.properties.wsdlFile.value.value = '' })
      }
      // Si es un archivo
      if (typeof value !== 'object') return
      this.properties.wsdlFile.value.value = value.name
      files.create({ path: this.title, fileName: 'wsdl', file: value, options: { unzip: true } })
        .then((resp) => {
          this.properties.wsdlIndex.options.value = resp.map(m => {
            return {
              label: m.name,
              value: m.name
            }
          })
        })
        .catch((resp) => {
          console.log(resp)
        })
    })
  }

  async onExecute ({ server, files, context, outputData }) {
    try {
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)

      const base = context.properties.value.config?.router?.base
      const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
      const prefix = pathUrl + `/${context.name}`
      const path = (context.environment.env === 'development' ? prefix : base) + this.properties.endpoint.value

      server.get(`${path}`, async (req, res, next) => {
        try {
          if (req.query.wsdl !== undefined) {
          // remplazar dentro de file
            const file = await files.get({ path: this.title + '/wsdl', fileName: this.properties.wsdlIndex.value })
            const regex = /schemaLocation="([^"]+)"/g
            const regexLocation = / location="([^"]+)"/g
            console.log(`${this.#base_url}${path}`)
            const fileResult = file.replace(regex, `schemaLocation="${path}/$1"`).replace(regexLocation, ` location="${context.environment.base_url}${path}"`)
            res.header('Content-Type', 'text/xml')
            res.send(fileResult)
          } else {
            return res.status(400).send('No se ha solicitado wsdl')
          }
        } catch (error) {
          console.log('🚀 ~ file: soap.js:118 ~ server.get ~ error:', error)
          return res.status(400).send('No se ha encontrado el archivo')
        }
      })
      // Archivos extra
      server.get(`${path}/:file`, async (req, res, next) => {
        try {
          const file = await files.get({ path: this.title + '/wsdl', fileName: req.params.file })
          const regex = /schemaLocation="([^"]+)"/g
          const fileResult = file.replace(regex, `schemaLocation="${path}/$1"`)
          res.header('Content-Type', 'text/xml')
          return res.send(fileResult)
        } catch (error) {
          return res.status(400).send('No se ha encontrado el archivo')
        }
      })
      // Datos post
      server.post(`${path}`, (req, res, next) => {
        try {
          const { XMLParser } = require('fast-xml-parser')
          const parser = new XMLParser()
          const jObj = parser.parse(req.body)
          return outputData('response', jObj, { req, res, startTime: new Date().getTime() })
        } catch (error) {
          return outputData('error', error.toString(), { req, res, startTime: new Date().getTime() })
        }
      })
    } catch (error) {
      return outputData('error', error.toString())
    }
  }
}
