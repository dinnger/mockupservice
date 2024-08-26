// Archivos Externos
import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import cors from 'cors'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import fileUpload from 'express-fileupload'
import session from 'express-session'
import { createRequire } from 'node:module'
import { Executions } from './workerExecute'
const require = createRequire(import.meta.url)
const pack = require('../package.json')
const version = pack.version || '0.0.0'

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001'
]
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['set-cookie']
}

class WORKER {
  type: string
  port: number
  file: string
  isDev: boolean
  idModel: string
  server: http.Server
  app: express.Express
  model: any

  constructor ({ type, port, file, isDev = false } : { type: string, port: number, file: string, isDev?: boolean }) {
    this.type = type
    this.port = port
    this.file = file
    this.isDev = isDev
    this.idModel = ''
    // this.server = null
    // this.app = null
    this.model = null
  }

  async start ({ isTest = false } = {}) {
    const fileName = this.file.replace(/\\/g, '/')
    const idModel = fileName.split('/').pop()
    if (idModel) this.idModel = idModel.split('.')[0]
    this.app = express()
    this.app.use(session({
      secret: 'efa$3221',
      resave: false,
      saveUninitialized: false
      // cookie: { maxAge: 60 * 60 * 1000 }
    }))
    this.app.use(fileUpload())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.text({ type: 'text/*' }))
    this.app.use(bodyParser.text({ type: '*/xml' }))
    this.app.use(cors(corsOptions))
    this.app.set('trust proxy', 1)

    this.server = http.createServer(this.app)
    // this.server.port = this.port

    // Si es test se omite el levantado del server web
    if (isTest) return true

    return new Promise(resolve => {
      this.server.listen(this.port, function () {
        console.log('CREATE')

        resolve({ app: this.app, server: this.server })
      })
    })
  }

  async initExecute ({ test = null, useCase = null }: { test?: Function | null, useCase?: string | null } = {}) {
    const executions = new Executions()

    // =========================================================
    // Test
    // =========================================================
    executions.on('execute/test', (data) => {
      if (test) test(data)
    })
    // =========================================================
    await executions.init({ server: this.app, serverInstance: this.server, isDev: this.isDev, isTest: !!test, useCase })
    this.model = await executions.initFlow({ flow: this.file })

    if (this.isDev === true) {
      const { WorkerSocket } = await import('./workerSocket.ts')
      const PATH_URL = process.env.PATH_URL?.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL
      console.log('Socket: ', `${PATH_URL}/${this.type}_${this.idModel}/socket.io`)
      const wSocket = new WorkerSocket({ flow: this.file, server: this.server, path: `${PATH_URL}/${this.type}_${this.idModel}/socket.io`, instances: { executions } })
      wSocket.init()
    } else {
      // try {
      //   const { Client } = require('pg')
      //   const date = new Date().toISOString()
      //   const config = require('./config.json')
      //   const client = new Client({
      //     host: process.env.GLOBAL_POSTGRES_HOST,
      //     ...config
      //   })
      //   await client.connect()
      //   const flow = await client.query(`select deploy from ${folder}.${this.type.toUpperCase()} where id = $1`, [this.idModel])
      //   if (flow.rows.length === 0) return false
      //   const dev = (!flow.rows[0].deploy) ? JSON.stringify({ [process.env.GLOBAL_INSTANCE]: { version, date } }) : JSON.stringify({ ...flow.rows[0].deploy, [process.env.GLOBAL_INSTANCE]: { version, date } })
      //   await client.query(`update ${folder}.${this.type.toUpperCase()} set deploy=$1 where id = $2`, [dev, this.idModel])
      //   await client.end()
      // } catch (error) {
      //   console.log('Error: ', error)
      // }
    }
    return true
  }

  intSwagger () {
    const options = {
      name: `${this.model.properties.name}`,
      description: this.model.properties.description,
      version: this.model.properties.version
    }

    /**
   * =====================================================================================================
   * SWAGGER
   * =====================================================================================================
   * @description Documentación de la API.
   * =====================================================================================================
   */
    const PATH_URL = process.env.PATH_URL?.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL
    const URL = process.env.BASE_URL ?? '' + PATH_URL
    const optionsSwagger = {
      definition: {
        openapi: '3.1.0',
        info: {
          title: options.name,
          version: `v${options.version} -  ${version}`,
          description: options.description
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer'
            }
          }
        },
        servers: [
          {
            url: `${URL}/flow_${this.idModel}/`
          }
        ]
      },
      apis: ['./swagger/*.js']
    }
    const specs = swaggerJsdoc(optionsSwagger)
    this.app.use(`${PATH_URL}/${this.type}_${this.idModel}/api-docs`, swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        validatorUrl: null
      }
    }))
  }
}

if (process.argv[3]) {
  const servicio = new WORKER({ type: process.argv[2], file: process.argv[3], port: Number(process.argv[4]) || 3000, isDev: Boolean(process.argv[5]) || false })
  await servicio.start()
  await servicio.initExecute()
  // servicio.intSwagger()
}
export default WORKER
