export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pre RUN apt-get update
  // #pre RUN apt-get install default-jdk -y
  //
  // #pk cassandra-driver
  // ===============================================
  constructor ({ ORM }) {
    this.title = 'Cassandra'
    this.desc = 'Permite realizar llamadas a Cassandra'
    this.icon = '󰆼'
    this.group = 'Base de Datos'
    this.color = '#ee7d22'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.orm = new ORM('cassandra')
    this.properties = this.orm.properties
  }

  async onCreate () {
    this.orm.onCreateORM()
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    let client = null
    const { config, validStore, setStore, getStore, deleteStore, retryStore } = await this.orm.getConfigORM({ properties: this.properties, context })
    try {
      if (!validStore || !getStore()) {
        const cassandra = require('cassandra-driver')
        const authProvider = new cassandra.auth.PlainTextAuthProvider(
          config.user,
          config.password
        )
        client = new cassandra.Client({
          contactPoints: config.host.split(','),
          localDataCenter: config.dataCenter,
          authProvider,
          policies: {
            loadBalancing: new cassandra.policies.loadBalancing.DCAwareRoundRobinPolicy(config.dataCenter, 3),
            RetryPolicy: 3
          },
          keyspace: config.keyspace
        })
        if (validStore) setStore(client)
      } else {
        client = getStore()
      }
      await client.execute(this.properties.query.value)
        .then(result => {
          outputData('response', result.rows)
        })
        .catch(error => {
          outputData('error', { error: error.toString() })
        })
    } catch (error) {
      if (!context.retry && validStore) return retryStore(this, { context, outputData })
      if (validStore) deleteStore()
      outputData('error', { error: error.toString() })
    }
  }
}
