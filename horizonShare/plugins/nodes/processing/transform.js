export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk crypto-js
  // #pk date-fns
  // ===============================================
  constructor () {
    this.title = 'Transform'
    this.desc = 'Permite transformación de datos'
    this.icon = '󰘙'
    this.group = 'Procesamiento'
    this.color = '#F39C12'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.properties = {
      options: {
        label: 'Condicionales:',
        type: 'list',
        object: {
          where: {
            label: 'Condición',
            type: 'string',
            value: ''
          },
          body: {
            label: 'Respuesta',
            type: 'code',
            lang: ['javascript', 'JavaScript'],
            value: ''
          },
          output: {
            label: 'Variable de Salida',
            type: 'string',
            value: ''
          }
        },
        value: []
      }
    }
  }

  async onExecute ({ outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    try {
      // console.log(this.properties)
      const data = {}
      // Se utiliza para responder directamente si no existe variable de salida
      let directResponse = ''
      directResponse = null

      this.properties.options.value.forEach(item => {
        if (!item.body.value || item.body.value === '') return
        let valid = null
        valid = true

        if (item.where.value && item.where.value !== '') {
          // eslint-disable-next-line no-eval
          eval(`valid = (${item.where.value})`)
        }
        if (valid) {
          let body = ''
          if (item.output.value && item.output.value !== '') {
            body = `data['${item.output.value}'] = ${item.body.value}`
          } else {
            body = `directResponse = ${item.body.value}`
          }
          // eslint-disable-next-line no-unused-vars
          const fn = {
            encrypt (text, key) {
              const CryptoJS = require('crypto-js')
              return CryptoJS.AES.encrypt(JSON.stringify(text), key).toString()
            },
            decrypt (text, key) {
              const CryptoJS = require('crypto-js')
              const bytes = CryptoJS.AES.decrypt(text, key)
              return bytes.toString(CryptoJS.enc.Utf8)
            },
            lpad (value, length, char) {
              return value.toString().padStart(length, char)
            },
            rpad (value, length, char) {
              return value.toString().padEnd(length, char)
            },
            formatDate (date, format = 'yyyy-MM-dd', lang = 'en') {
              const { format: fnFormat } = require('date-fns')
              const { es, en } = require('date-fns/locale')
              try {
                if (typeof date === 'string') date = date.replace(/"/g, '').replace(/'/g, '')
                return fnFormat(new Date(date), format, { locale: lang === 'es' ? es : en })
              } catch (error) {
                console.log('Transformación', error)
                return ''
              }
            }
          }
          // eslint-disable-next-line no-eval
          eval(body)
        }
      })
      if (directResponse) {
        return outputData('response', directResponse)
      }
      outputData('response', data)
    } catch (error) {
      outputData('error', error.toString())
    }
  }
}
