export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk pg
  // #pk pg-hstore
  // ===============================================
  constructor ({ ORM }) {
    this.title = 'Postgres'
    this.desc = 'Permite realizar llamadas a postgres'
    this.icon = '󰆼'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('postgres')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    let pool = null
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })
    try {
      if (!validStore || !getStore()) {
        const { Pool } = require('pg')
        pool = new Pool(config)
        if (validStore) setStore(pool)
      } else {
        pool = getStore()
      }
      const res = await pool.query(this.properties.query.value)
      if (!validStore) pool.end()

      outputData('response', res.rows || res.map(m => m.rows))
    } catch (err) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (validStore) deleteStore()
      if (pool) pool.end()
      outputData('error', { error: err.toString() })
    }
  }
}
