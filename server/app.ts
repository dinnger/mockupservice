import express from 'express'
import http from 'http'
import https from 'https'
import cors from 'cors'
import 'dotenv/config'
import fs from 'fs'
import { createRequire } from 'node:module'

import { HorizonServer } from '../horizonServer/index'
const require = createRequire(import.meta.url)

async function init () {
// SECURITY

  const allowedOrigins = '*'
  const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ['set-cookie']
  }

  const app = express()
  const bodyParser = require('body-parser')
  app.setMaxListeners(100)
  const jsonParser = bodyParser.json()
  app.use(cors(corsOptions))
  app.set('trust proxy', 1) // trust first proxy

  let port: number | string | undefined
  let server: http.Server | https.Server
  if (process.env.SSL_MODE === 'true') {
    port = 443
    const options = {
      key: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/dinnger.com/fullchain.pem')
    }
    server = https.createServer(options, app)
  } else {
    port = process.env.SERVER_PORT
    server = http.createServer(app)
  }

  const PATH_URL = process.env.PATH_URL?.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL ?? ''

  const horizonServer = new HorizonServer({ app, server })

  // appInstance solo sera devuelto si es modo desarrollo (appInstance permite conexión a db)

  const { appInstance } = await horizonServer.init({ isDev: process.env.NODE_ENV === 'development' })

  if (process.env.NODE_ENV === 'development') {
  /**
   * =====================================================================================================
   * PÁGINA
   * =====================================================================================================
   */
    const history = require('connect-history-api-fallback')
    const pathStatic = express.static('./dist')
    app.use(PATH_URL + '/ui', history({ verbose: false }))
    app.use(PATH_URL + '/ui', pathStatic)

    const pathStaticDoc = express.static('./distDocs')
    app.use(PATH_URL + '/doc', pathStaticDoc)
    app.use(PATH_URL + '/doc', history({ verbose: false }))

    const RouterLogin = await import('./router/login.js')
    app.use(PATH_URL + '/_login', jsonParser, RouterLogin.initRouter({ app, appInstance }))

    const apiMetrics = require('prometheus-api-metrics')
    app.use(apiMetrics({ metricsPath: PATH_URL + '/metrics' }))
  }

  server.listen(port, function () {
    const version = require('../package.json')
    console.log('[Server]', 'env:', process.env.NODE_ENV)
    console.log('[Server]', 'versión:', version.version)
    console.log('[Server]', 'puerto: ' + port)
  })
}
init()
