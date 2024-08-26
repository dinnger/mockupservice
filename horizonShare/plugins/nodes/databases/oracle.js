export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pre RUN apt-get update
  // #pre RUN apt-get install wget -y
  // #pre RUN apt-get install zip unzip -y
  // #pre RUN wget https://download.oracle.com/otn_software/linux/instantclient/1919000/instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
  // #pre RUN unzip instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
  // #pre RUN rm instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
  // #pre RUN apt-get install libaio1 -y
  // #pre RUN apt-get install lsof -y
  //
  // #pk oracledb
  // ===============================================
  constructor ({ ORM }) {
    this.title = 'Oracle'
    this.desc = 'Permite realizar llamadas a oracle'
    this.icon = '󰆼'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('oracle')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ outputData, context }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    let db = null
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })

    try {
      if (!validStore || !getStore()) {
        const oracledb = require('oracledb')
        oracledb.autoCommit = true
        oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT
        const tempConfig = {
          connectionString: config.host + '/' + config.database,
          user: config.user,
          password: config.password
        }
        db = await oracledb.getConnection(tempConfig)
        db.callTimeout = config.timeout * 1000
        if (validStore) setStore(db)
      } else {
        db = getStore()
      }

      const rs = await db.execute(this.properties.query.value, [])
      const data = rs.rows
      if (!validStore) db.close()

      outputData('response', data)
    } catch (err) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (validStore) deleteStore()
      if (db) db.close()
      outputData('error', err.toString())
    }
  }
}
