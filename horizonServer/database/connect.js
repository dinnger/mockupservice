import { Sequelize } from 'sequelize'
import fs from 'fs'
import { initSeed } from './seed.js'
import { createRequire } from 'node:module'
import 'dotenv/config'
// SECURITY
const db = {}
let fnIsConnect = null
const require = createRequire(import.meta.url)

console.log('[Server]', 'Iniciando conexión database:', process.env.GLOBAL_POSTGRES_HOST)

const config = require('./config.json')
config.host = process.env.GLOBAL_POSTGRES_HOST
const sequelize = new Sequelize(process.env.DB_CONNECT || {
  ...config
})
sequelize.options.logging = false

try {
  await sequelize.authenticate()
  console.log('🚀 ~ Conexión exitosa')

  let count = 0
  const path = './horizonServer/database/models'
  const files = fs.readdirSync(path)
  files.forEach(async file => {
    const { models } = await import(`./models/${file}`)
    const model = models(sequelize)
    const schema = model._schema.toUpperCase()
    if (!db[schema]) db[schema] = {}

    db[schema][model.name.toUpperCase()] = model
    count++
    if (count === files.length) associate()
  })

  const associate = async () => {
    Object.keys(db).forEach(schema => {
      let count = 0
      Object.keys(db[schema]).forEach(modelName => {
        count++
        if (db[schema][modelName].associate) {
          db[schema][modelName].associate(db)
        }
      })
      console.log('[Server] [Model] ' + count + ' Tablas - Esquema ' + schema)
    })

    if (process.env.DB_UPDATE === true || process.env.DB_UPDATE === 'true') {
      console.log('> Actualizar base de datos', process.env.DB_UPDATE)
      await sequelize.sync({ alter: true }).catch(err => console.log(err))
      if (fnIsConnect) fnIsConnect({ error: null })
      isAdminExist()
    } else {
      if (fnIsConnect) fnIsConnect({ error: null })
      isAdminExist()
    }
  }
} catch (error) {
  if (fnIsConnect) fnIsConnect({ error })
  console.error('☠️  ~ Conexión fallida', error.toString())
}

const isAdminExist = async () => {
  const user = await db.SECURITY.USERS_LOCAL.findOne({ where: { alias: 'admin' } })
  if (!user) {
    initSeed(db)
  }
}

// Función para saber si la conexión se realizó
const isConnect = (fn) => {
  fnIsConnect = fn
}

const Op = Sequelize.Op
export { sequelize, Op, db, isConnect }
