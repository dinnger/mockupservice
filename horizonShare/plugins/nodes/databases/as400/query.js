export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pre RUN apt-get update
  // #pre RUN apt-get install wget -y
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
  constructor ({ ORM }) {
    this.title = 'AS400'
    this.desc = 'Permite realizar llamadas a AS400'
    this.icon = '󰆼'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('as400')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    let sendData = false

    let pool = null
    let timeout = 0
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })
    try {
      if (!validStore || !getStore()) {
        timeout = config.timeout
        pool = require('node-jt400').pool(config)
        if (validStore) setStore({ pool, timeout: config.timeout })
      } else {
        pool = getStore().pool
        timeout = getStore().timeout
      }
      const timer = setTimeout(() => {
        // Eliminación de la referencia global
        if (validStore) deleteStore()
        pool.close()
        if (!sendData) outputData('error', { msg: 'Timeout' })
        sendData = true
      }, timeout * 1000)

      const query = this.properties.query.value.toUpperCase().trim()
      if (query.startsWith('SELECT') || query.startsWith('CALL')) {
        pool.query(this.properties.query.value)
          .then((result) => {
            clearTimeout(timer)
            if (!validStore) pool.close()
            if (!sendData) outputData('response', result)
            sendData = true
          }).catch((err) => {
            clearTimeout(timer)
            if (!validStore) pool.close()
            if (!sendData) outputData('error', { error: err.toString() })
            sendData = true
          })
      } else {
        pool.update(this.properties.query.value)
          .then((result) => {
            clearTimeout(timer)
            if (!validStore) pool.close()
            if (!sendData) outputData('response', result)
            sendData = true
          }).catch((err) => {
            clearTimeout(timer)
            if (!validStore) pool.close()
            if (!sendData) outputData('error', { error: err.toString() })
            sendData = true
          })
      }
    } catch (error) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (!sendData) outputData('error', { error: error.toString() })
      sendData = true
    }
  }
}
