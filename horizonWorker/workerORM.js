import CryptoJS from 'crypto-js'

// Determina la flag para indicar que es la primera vez que se llama
let init = false
let response = false
const cache = {}
export async function getCredential ({ tag, token }) {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const { Client } = require('pg')

  return new Promise((resolve, reject) => {
    // Cache
    if (cache[`${tag}_${token}`]) {
      // Si la credencial es menor a 1 hora se retorna
      if (parseFloat((new Date().getTime() / 1000).toFixed(0)) - cache[`${tag}_${token}`].ttl < 3600) {
        return resolve(cache[`${tag}_${token}`])
      }
    } else if (!response) {
      // Determina si existen muchas llamadas al mismo tiempo y no se ha obtenido la conexión espera 1seg para verificar nuevamente
      setTimeout(() => {
        if (cache[`${tag}_${token}`]) return resolve(cache[`${tag}_${token}`])
        reject(new Error('No se pudo obtener la credencial'))
      }, 1000)
    }

    if (init && !response) return false
    init = true

    const connect = async () => {
      const config = require('./config.json')
      const client = new Client({
        host: process.env.GLOBAL_POSTGRES_HOST,
        ...config
      })
      await client.connect()
      try {
        const resp = await client.query(`SELECT * FROM security.secret where tag = '${tag}' and token = '${token}'`)
        await client.end()
        const respuesta = resp.rows.length > 0 ? resp.rows[0] : null
        if (respuesta) {
          const bytes = CryptoJS.AES.decrypt(respuesta.data, '3Wf]P~P<46Vm')
          const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
          cache[`${tag}_${token}`] = data
          cache[`${tag}_${token}`].ttl = parseFloat((new Date().getTime() / 1000).toFixed(0))
          response = true
          return resolve(cache[`${tag}_${token}`])
        } else {
          reject(new Error('No se pudo obtener la credencial'))
        }
      } catch (error) {
        if (cache[`${tag}_${token}`]) cache[`${tag}_${token}`].ttl = parseFloat((new Date().getTime() / 1000).toFixed(0))
        response = true
        console.log('error orm')
        reject(error)
      }
    }
    connect()
  })
}
