import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { Client } = require('pg')

export function WorkerSecurity () {
  return {
    list: ({ node }) => {
      return new Promise((resolve, reject) => {
        const connect = async () => {
          const config = require('../config.json')
          const client = new Client({
            host: process.env.GLOBAL_POSTGRES_HOST,
            ...config
          })
          await client.connect()
          try {
            const resp = await client.query('SELECT  tag,token FROM security.secret where node = $1 and instance = $2 and activo = true', [node, 'dev'])
            await client.end()
            const respuesta = resp.rows
            return resolve(respuesta)
          } catch (error) {
            reject(error)
          }
        }
        connect()
      })
    },

    get: ({ tag, token }) => {
      return new Promise((resolve, reject) => {
        const connect = async () => {
          const config = require('../config.json')
          const client = new Client({
            host: process.env.GLOBAL_POSTGRES_HOST,
            ...config
          })
          await client.connect()
          try {
            const rows = await client.query('SELECT * FROM security.credential where tag = $1 and token = $2', [tag, token])
            const respuesta = rows.length > 0 ? JSON.parse(rows[0].data) : rows
            return resolve(respuesta)
          } catch (error) {
            reject(error)
          }
        }
        connect()
      })
    }
  }
}
