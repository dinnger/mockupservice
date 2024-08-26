export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk pg
  // #pk pg-hstore
  // ===============================================
  constructor ({ ORM }) {
    this.title = 'SQLite'
    this.desc = 'Permite realizar llamadas a SQLite'
    this.icon = '󰆼'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('sqlite')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const ownerAlias = context.properties?.value?.owner?.alias || null
    if (!ownerAlias) return outputData('error', { error: 'No se encontro el alias del usuario' })

    let pool = null
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })
    const path = `./_database/${ownerAlias}/` + (config.databaseName || 'test') + '.db'
    try {
      if (!validStore || !getStore()) {
        const fs = require('fs')
        if (!fs.existsSync(path)) return outputData('error', { error: 'No se encontró la base de datos ' + path })
        const sqlite3 = require('sqlite3').verbose()
        pool = new sqlite3.Database(path)
        if (validStore) setStore(pool)
      } else {
        pool = getStore()
      }
      const query = this.properties.query.value
      if (query.toUpperCase().indexOf('SELECT') >= 0) {
        await pool.all(query, (err, res) => {
          if (err) return outputData('error', { error: err.toString() })
          outputData('response', res)
        })
      } else {
        await pool.run(query, function (err, res) {
          if (err) return outputData('error', { error: err.toString() })
          if (this.lastID && this.lastID > 0) return outputData('response', { lastID: this.lastID })
          outputData('response', res)
        })
        // if (!validStore) pool.end()
      }
    } catch (err) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (validStore) deleteStore()
      // if (pool) pool.end()
      outputData('error', { error: err.toString() })
    }
  }
}
