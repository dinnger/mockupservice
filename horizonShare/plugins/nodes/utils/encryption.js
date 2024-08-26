export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk crypto-js
  // #pk bcrypt
  // #pk jsonwebtoken
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Cifrado'
    this.desc = 'Permite encriptar o desencriptar'
    this.icon = '󱜦'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.ref = ref
    this.watch = watch
    this.properties = {
      type: {
        label: 'Tipo de utilidad:',
        type: 'options',
        options: [
          {
            label: 'Generador Bcrypt',
            value: 'encriptBcrypt'
          }, {
            label: 'Validador Bcrypt',
            value: 'validBcrypt'
          },
          {
            label: 'Generador JWT',
            value: 'encriptJWT'
          },
          {
            label: 'Validador JWT',
            value: 'validJWT'
          },
          {
            label: 'Cifrado con llave',
            value: 'encrypt'
          },
          {
            label: 'Descifrado con llave',
            value: 'decrypt'
          }
        ],
        value: ''
      },
      encriptBcrypt: {
        label: 'Valor a encriptar:',
        type: 'string',
        show: ref(false),
        value: ''
      },
      validBcryptOrigen: {
        label: 'Bcrypt origen:',
        type: 'string',
        show: ref(false),
        value: ''
      },
      validBcryptValid: {
        label: 'Valor a validar:',
        type: 'string',
        show: ref(false),
        value: ''
      },
      encriptJWT: {
        label: 'Valor a encriptar (json):',
        type: 'code',
        lang: ['json', 'Json'],
        show: ref(false),
        value: '{\n}'
      },
      encriptJWTValue: {
        label: 'Token a validar:',
        type: 'string',
        show: ref(false),
        value: ''
      },
      encriptJWTSecret: {
        label: 'Secreto:',
        type: 'string',
        show: ref(false),
        value: ''
      },
      encriptJWTExpiresIn: {
        label: 'Tiempo de expiración (Horas):',
        type: 'number',
        show: ref(false),
        value: 12
      },
      encriptValue: {
        label: 'Valor a cifrar/descifrar (json):',
        type: 'string',
        show: ref(false),
        value: ''
      },
      encriptKey: {
        label: 'Palabra clave',
        type: 'string',
        show: ref(false),
        value: ''
      }
    }
  }

  onCreate ({ context }) {
    this.properties.type.value = this.ref(this.properties.type.value)

    const update = () => {
      this.properties.encriptBcrypt.show.value = false
      this.properties.validBcryptOrigen.show.value = false
      this.properties.validBcryptValid.show.value = false
      this.properties.encriptJWT.show.value = false
      this.properties.encriptJWTValue.show.value = false
      this.properties.encriptJWTSecret.show.value = false
      this.properties.encriptJWTExpiresIn.show.value = false
      this.properties.encriptValue.show.value = false
      this.properties.encriptKey.show.value = false

      if (this.properties.type.value.value === 'encriptBcrypt') {
        this.properties.encriptBcrypt.show.value = true
      }
      if (this.properties.type.value.value === 'validBcrypt') {
        this.properties.validBcryptOrigen.show.value = true
        this.properties.validBcryptValid.show.value = true
      }
      if (this.properties.type.value.value === 'encriptJWT') {
        this.properties.encriptJWT.show.value = true
        this.properties.encriptJWTSecret.show.value = true
        this.properties.encriptJWTExpiresIn.show.value = true
      }
      if (this.properties.type.value.value === 'validJWT') {
        this.properties.encriptJWTValue.show.value = true
        this.properties.encriptJWTSecret.show.value = true
      }
      if (this.properties.type.value.value === 'encrypt') {
        this.properties.encriptValue.show.value = true
        this.properties.encriptKey.show.value = true
      }
      if (this.properties.type.value.value === 'decrypt') {
        this.properties.encriptValue.show.value = true
        this.properties.encriptKey.show.value = true
      }
    }
    this.watch(this.properties.type.value, (value) => {
      update()
    })
    update()
  }

  async onExecute ({ outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    try {
      if (this.properties.type.value === 'encriptBcrypt') {
        const bcrypt = require('bcrypt')
        const saltRounds = 10
        const hash = bcrypt.hashSync(this.properties.encriptBcrypt.value, saltRounds)
        return outputData('response', { hash })
      }
      if (this.properties.type.value === 'validBcrypt') {
        const bcrypt = require('bcrypt')
        const valid = bcrypt.compareSync(this.properties.validBcryptValid.value, this.properties.validBcryptOrigen.value)
        return outputData('response', { valid })
      }
      if (this.properties.type.value === 'encriptJWT') {
        const jwt = require('jsonwebtoken')
        const encriptJWT = this.properties.encriptJWT.value
        const hash = jwt.sign(typeof encriptJWT === 'string' ? JSON.parse(encriptJWT) : encriptJWT, this.properties.encriptJWTSecret.value, { expiresIn: this.properties.encriptJWTExpiresIn.value * 60 * 60 })
        return outputData('response', { hash })
      }
      if (this.properties.type.value === 'validJWT') {
        const jwt = require('jsonwebtoken')
        const val = jwt.verify(this.properties.encriptJWTValue.value, this.properties.encriptJWTSecret.value)
        return outputData('response', val)
      }
      if (this.properties.type.value === 'encrypt') {
        const CryptoJS = require('crypto-js')
        const text = (typeof this.properties.encriptValue.value === 'object') ? JSON.stringify(this.properties.encriptValue.value) : this.properties.encriptValue.value
        console.log(text)
        const val = CryptoJS.AES.encrypt(text, this.properties.encriptKey.value).toString()
        console.log(val)
        return outputData('response', val)
      }
      if (this.properties.type.value === 'decrypt') {
        const CryptoJS = require('crypto-js')
        const bytes = CryptoJS.AES.decrypt(this.properties.encriptValue.value, this.properties.encriptKey.value)
        const val = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
        return outputData('response', val)
      }
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
