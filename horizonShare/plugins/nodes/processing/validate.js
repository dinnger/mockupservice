export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk ajv
  // #pk ajv-formats
  // #pk ajv-i18n
  // #pk ajv-errors
  // ===============================================
  constructor () {
    this.title = 'Validación'
    this.desc = 'Realiza una validación de la información proporcionada'
    this.icon = '󰍕'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('ok')
    this.addOutput('error')

    this.properties = {
      options: {
        label: 'Listado de validaciones:',
        type: 'list',
        object: {
          input: {
            label: 'Valor a validar',
            type: 'string',
            value: ''
          },
          body: {
            label: 'Validación: (AJV)',
            type: 'code',
            lang: ['json', 'Json'],
            value: `{
  "type": "object",
  "properties": {
    "dato1": {
      "type": "string",
      "minLength": 1
    },
    "dato2": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "dato3": {
      "type": "string",
      "errorMessage":"El campo dato3 debe de ser un texto"
    }
  },
  "required": [
    "dato1",
    "dato2",
    "dato3"
  ],
  "additionalProperties": false,
  "errorMessage": {
    "type:": "El tipo del campo $$ no corresponde",
    "required": "El campo $$ es requerido.",
    "additionalProperties": "La propiedad $$ no esta definida."
  }
}`
          }
        },
        value: []
      }
    }
  }

  async onExecute ({ inputData, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    try {
      // eslint-disable-next-line no-unused-vars
      const Ajv = require('ajv') // version >= 2.0.0
      // const localize = require('ajv-i18n')
      const addFormats = require('ajv-formats')
      const ajv = new Ajv({ allErrors: true })
      addFormats(ajv)
      require('ajv-errors')(ajv /*, {singleError: true} */)
      const value = this.properties.options.value
      const errors = []
      const validate = []

      const replaceMessage = (arr, item) => {
        const errorMessage = item.keyword === 'errorMessage'
        if (!errorMessage) {
          arr.push(item.instancePath.replace('/', '') + ' ' + item.message)
          return
        }

        item.params.errors.forEach(m => {
          let val = Object.entries(m.params)
          if (Array.isArray(val)) val = val[0][1]
          arr.push(item.message.replace(/\$\$/g, val))
        })
      }

      value.forEach(element => {
        if (element.body.value === '') return
        const valid = new Promise((resolve, reject) => {
          let schema = ''
          schema = null

          // eslint-disable-next-line no-eval
          eval(`schema = ${element.body.value}`)
          if (schema) {
            const validate = ajv.compile(schema)
            const valid = validate(element.input.value)
            if (!valid) {
              // localize.es(validate.errors)
              validate.errors.map(m => replaceMessage(errors, m))
              // eslint-disable-next-line prefer-promise-reject-errors
              return reject({
                error: errors
              })
            }
            resolve(true)
          }
        })
        validate.push(valid)
      })

      Promise.all(validate)
        .then(() => { outputData('ok', inputData.data) })
        .catch((err) => {
          outputData('error', { error: err?.error || err.toString() })
        })

      // outputData()
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
