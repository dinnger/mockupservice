export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk jsonwebtoken
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Webhook'
    this.desc = 'Call webhook'
    this.icon = '󰘯'
    this.group = 'Triggers'
    this.color = '#3498DB'
    this.isTrigger = true

    this.addInput('input')
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
          label: 'PATCH',
          value: 'patch'
        }, {
          label: 'PUT',
          value: 'put'
        }, {
          label: 'DELETE',
          value: 'delete'
        }],
        value: 'get'
      },
      timeout: {
        label: 'Tiempo de espera (seg):',
        type: 'number',
        value: 50
      },
      security: {
        label: 'Seguridad:',
        type: 'options',
        options: [{
          label: 'Ninguna',
          value: 'null'
        },
        {
          label: 'Básico',
          value: 'basic'
        },
        {
          label: 'JWT Bearer',
          value: 'jwt'
        },
        {
          label: 'Bearer Token',
          value: 'bearer'
        }],
        value: 'null'
      },
      securityBasicUser: {
        label: 'Usuario',
        type: 'string',
        value: '',
        show: ref(false)
      },
      securityBasicPass: {
        label: 'Contraseña',
        type: 'string',
        value: '',
        show: ref(false)
      },
      securityBearerToken: {
        label: 'Token',
        type: 'string',
        value: '',
        show: ref(false)
      },
      securityJWTSecret: {
        label: 'Secreto',
        type: 'string',
        value: '',
        show: ref(false)
      }

    }
  }

  onCreate ({ context }) {
    this.properties.url.value = this.ref('')
    this.properties.endpoint.value = this.ref(this.properties.endpoint.value)
    this.properties.security.value = this.ref(this.properties.security.value)

    const update = () => {
      this.properties.securityBasicUser.show.value = false
      this.properties.securityBasicPass.show.value = false
      this.properties.securityBearerToken.show.value = false
      this.properties.securityJWTSecret.show.value = false

      if (this.properties.security.value.value === 'basic') {
        this.properties.securityBasicUser.show.value = true
        this.properties.securityBasicPass.show.value = true
      }
      if (this.properties.security.value.value === 'bearer') {
        this.properties.securityBearerToken.show.value = true
      }
      if (this.properties.security.value.value === 'jwt') {
        this.properties.securityJWTSecret.show.value = true
      }
      const base = context.properties.value.config?.router?.base
      const prefix = `/flow_${context.properties.value.id}`
      const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
      const url = context.environment.base_url + pathUrl + encodeURI((prefix) + this.properties.endpoint.value.value)
      const urlProd = '( HOST )' + encodeURI((base) + this.properties.endpoint.value.value)
      this.properties.url.value.value = `
      <div class="grid " style="grid-template-columns: repeat(6, minmax(0, 1fr)); ">
        <div class="col-span-1"><strong>Desarrollo:</strong></div>
        <div style="grid-column:span 5 / span 1">${url}</div>
        <div style="grid-column:span 1 / span 1"><strong>Producción:</strong></div>
        <div style="grid-column:span 5 / span 5">${urlProd}</div>
      </div>`
    }
    update()

    this.watch(context.properties.value, () => update())
    this.watch(this.properties.endpoint.value, () => update())
    this.watch(this.properties.security.value, () => update())
  }

  async onExecute ({ server, context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    try {
      // Se define el prefixo de la ruta (Si es subFlow se utiliza el id del padre)
      let base
      let prefix
      if (context.environment.isSubFlow) {
        base = context.environment.subFlowBase
        prefix = `/flow_${context.environment.subFlowParent}`
      } else {
        base = context.properties.value.config?.router?.base
        prefix = `/flow_${context.properties.value.id}`
      }

      const pathUrl = context.environment.path_url.slice(-1) !== '/' ? context.environment.path_url : context.environment.path_url.slice(0, -1)
      const url = pathUrl + (context.environment.isDev ? prefix : base) + this.properties.endpoint.value

      console.log('WEBHOOK:', this.properties.type.value, url)

      server[this.properties.type.value](url, (req, res, next) => {
        const data = {
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
          files: req.files,
          method: req.method,
          endpoint: req.path,
          time: Date.now()
        }

        // Validar Seguridad
        if (this.properties.security.value === 'jwt') {
          // Validación de autenticación
          if (!data.headers?.authorization) {
            context.logger.error({ responseTime: this.properties.timeout.value * 1000, responseCode: 506 }, 'Solicitud Timed Out')
            return outputData('error', { error: 'Autenticación fallida', responseTime: this.properties.timeout.value * 1000, responseCode: 506 }, { req, res })
          }
          const jwt = require('jsonwebtoken')
          jwt.verify(data.headers.authorization.split(' ')[1], this.properties.securityJWTSecret.value, function (err, decoded) {
            if (err) return outputData('error', { error: err.toString() }, { req, res })
            data.security = decoded
            outputData('response', data, { req, res })
          })
        } else {
          outputData('response', data, { req, res })
          if (context.disabled) next()
        }

        // Timeout
        res.setTimeout(this.properties.timeout.value * 1000, () => {
          context.stopExecute()
          context.logger.error({ responseTime: this.properties.timeout.value * 1000, responseCode: 506 }, 'Solicitud Timed Out')
          res.status(506).send('Excedido el tiempo de respuesta')
        })
      })
    } catch (error) {
      console.log('🚀 ~ onExecute ~ error:', error)
      outputData('error', { error: error.toString() })
    }
  }
}
