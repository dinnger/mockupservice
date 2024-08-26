export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pre RUN apt-get update
  // #pre RUN apt-get install zip unzip -y
  // #pre RUN wget https://download.oracle.com/otn_software/linux/instantclient/1919000/instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip  -q
  // #pre RUN unzip instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
  // #pre RUN rm instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
  // #pre RUN apt-get install libaio1 -y
  // #pre RUN apt-get install lsof -y
  // #pre ENV LD_LIBRARY_PATH  /app/instantclient_19_19:
  // #pre RUN apt-get install default-jdk -y
  //
  // #pk node-jt400
  // ===============================================
  constructor () {
    this.title = 'AS400 Programa'
    this.desc = 'Permite realizar llamadas a AS400'
    this.icon = '󰆍'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input 2')
    this.addOutput('msg', 0)
    this.addOutput('error', 1)

    this.properties = {
      host: {
        label: 'Host',
        type: 'string',
        value: ''
      },
      user: {
        label: 'User',
        type: 'string',
        value: ''
      },
      password: {
        label: 'Password',
        type: 'string',
        value: ''
      },
      timeout: {
        label: 'Tiempo máximo de espera (seg):',
        type: 'number',
        value: 30
      },
      programName: {
        label: 'Nombre del Programa:',
        type: 'string',
        value: ''
      },
      paramsSchema: {
        label: 'Esquema del programa:',
        type: 'code',
        lang: ['javascript', 'JS'],
        value: '[\n]'
      },
      data: {
        label: 'Datos del programa:',
        type: 'code',
        lang: ['javascript', 'JS'],
        value: '{\n}'
      }
    }
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const config = {
      host: this.properties.host.value,
      user: this.properties.user.value,
      password: this.properties.password.value
    }
    let sendData = false
    try {
      const pool = require('node-jt400').pool(config)

      setTimeout(() => {
        pool.close()
        if (!sendData) outputData('error', { msg: 'Timeout' })
        sendData = true
      }, this.properties.timeout.value * 1000)

      let program = null
      program = ''

      const code = `
      program = pool.defineProgram({
        programName: '${this.properties.programName.value}',
        paramsSchema: ${this.properties.paramsSchema.value}
      })
      `
      // eslint-disable-next-line no-eval
      eval(code)

      let obj = null
      obj = ''

      // eslint-disable-next-line no-eval
      eval(`obj = ${typeof this.properties.data === 'object' ? JSON.stringify(this.properties.data) : this.properties.data}`)

      program(obj, 0).then((result) => {
        if (!sendData) outputData('msg', result)
        sendData = true
      }).fail((err) => {
        if (!sendData) outputData('error', err)
        sendData = true
      }).catch((err) => {
        if (!sendData) outputData('error', err)
        sendData = true
      })
    } catch (error) {
      if (!sendData) outputData('error', error.toString())
      sendData = true
    }
  }
}
