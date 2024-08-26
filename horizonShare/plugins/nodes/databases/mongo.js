export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk @synatic/noql
  // #pk mongodb
  // ===============================================
  constructor ({ ORM }) {
    this.title = 'Mongo'
    this.desc = 'Permite realizar llamadas a mongo'
    this.icon = '󰌪'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('mongo')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ outputData, context }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    let client = null
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })

    try {
      const SQLParser = require('@synatic/noql')
      const { MongoClient } = require('mongodb')

      if (!validStore || !getStore()) {
        client = new MongoClient(config.host, {
          connectTimeoutMS: config.timeout * 1000
        })
        await client.connect()
        if (validStore) setStore(client)
      } else {
        client = getStore()
      }
      const db = client.db(config.database)
      const parsedSQL = SQLParser.parseSQL(this.properties.query.value)
      // console.log(parsedSQL)
      if (parsedSQL.type === 'query') {
        const data =
          await db
            .collection(parsedSQL.collection)
            .find(parsedSQL.query || {}, parsedSQL.projection || {})
            .limit(parsedSQL.limit || 50)
            .toArray()
        if (!validStore) client.close()
        outputData('response', data)
      } else if (parsedSQL.type === 'aggregate') {
        const data =
          await db
            .collection(parsedSQL.collections[0])
            .aggregate(parsedSQL.pipeline)
            .toArray()
        if (!validStore) client.close()
        outputData('response', data)
      }
    } catch (exp) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (validStore) deleteStore()
      if (client) client.close()
      outputData('error', { error: exp.toString() })
    }
  }
}
