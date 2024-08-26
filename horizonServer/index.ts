import { HorizonWorker } from '../horizonWorker/index.js'
import router from './router/index.js'
import { Express } from 'express' // Add this line to import the 'Express' type

interface HorizonServerInterface {
  appInstance: any;
}

export class HorizonServer {
  app: Express
  server: any

  constructor ({ app, server }: { app: Express, server: any }) {
    this.app = app
    this.server = server
  }

  /**
  * Inicializa el servidor de Horizon
  * @param {boolean} isDev - Indica si el servidor está en modo desarrollo
  * @returns {Promise<void>}
  */
  async init ({ isDev = false }: { isDev?: boolean }): Promise<HorizonServerInterface> {
    const workerFlow = new HorizonWorker({ app: this.app })
    return new Promise((resolve, reject) => {
      if (isDev) {
        const PATH_URL = process.env.PATH_URL?.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL
        const load = async () => {
          const { connectToSocket } = await import('./serverSocket.js')
          const { initServer } = await import('./serverInitialize.js')
          await initServer()
            .then((value) => {
              connectToSocket({ server: this.server, path: PATH_URL + '/socket.io', allowedOrigins: '*', isDev })
              resolve(value)
            })
            .catch(err => {
              console.log(err)
              reject(err)
            })
          workerFlow.createPersistent({ type: 'flow_deploy' })
        }
        load()
        // Router
        router({ app: this.app, pathUrl: PATH_URL })
      } else {
        const load = async () => {
          const fs = await import('fs')
          if (process.env.LOG_PATH && !fs.existsSync(process.env.LOG_PATH)) fs.mkdirSync(process.env.LOG_PATH, { recursive: true })
          workerFlow.create({ id: '*', type: 'flow' })
          workerFlow.create({ id: '*', type: 'process' })
          resolve({ appInstance: null })
        }
        load()
      }
    })
  }
}
