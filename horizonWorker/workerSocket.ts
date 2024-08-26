// wFile contiene el modelo de datos de los flujos (WorkerFile)
import { WorkerModel } from './application/workerFile.js'
import { WorkerSecurity } from './application/workerSecurity.js'
import { WorkerInstance } from './application/workerInstance.js'
import http from 'http'

class WorkerSocket {
  flow: string
  type: string
  instances: any
  server: http.Server
  allowedOrigins: string
  path: string
  session: any
  register: any
  io: any

  constructor ({ flow, type, server, path = '/socket.io', allowedOrigins, session, instances }: { flow: string, type?: string, server: http.Server, path?: string, allowedOrigins?: string, session?: any, instances?: any }) {
    this.flow = flow
    this.type = type
    this.instances = instances
    this.server = server
    this.allowedOrigins = allowedOrigins || '*'
    this.path = path
    this.session = session

    const workerModel = new WorkerModel()
    const WorkModel = () => {
      return {
        get: () => { return workerModel.get({ flow: this.flow }) }
      }
    }
    const WorkDir = () => {
      return {
        list: () => { return workerModel.workDir().list() }
      }
    }
    this.register = {
      WorkModel,
      WorkDir,
      WorkerSecurity,
      Worker: WorkerInstance
    }
  }

  /**
   * Inicializa el servidor.
   * @returns {Promise<void>}
   */
  async init () {
    const { Server } = await import('socket.io')

    this.io = new Server(this.server, {
      maxHttpBufferSize: 1e8,
      path: this.path,
      cors: {
        credentials: true,
        origin: this.allowedOrigins
      }
    })
    this.socketInit()
    // Inicializa la escucha del socket
    this.socketListen()
    return true
  }

  /**
   * Inicializa el socket.
   * @returns {Promise<void>}
   */
  async socketInit () {
    if (this.session) this.io.engine.use(this.session)
    this.io.on('connection', async (socket) => {
      // Captura el nombre del evento y lo busca en el registro
      socket.onAny((event, ...args) => {
        const session = socket.session
        const params = args.length > 0 ? typeof args[0] === 'object' ? args[0] : {} : {}
        const callback = args.length === 2 ? args[1] : typeof args[0] === 'function' ? args[0] : null
        const obj = event.split('/')
        let tempRegister = this.register
        const exec = async (index) => {
          if (index >= obj.length) {
            if (callback) callback(tempRegister)
            return
          }
          const name = obj[index]
          if (tempRegister[name]) {
            try {
              tempRegister = await tempRegister[name]({ socket, session, ...params })
            } catch (error) {
              tempRegister = { error: error.toString() }
            }
            exec(index + 1)
          } else {
            if (callback) callback(null)
            console.log(this.register)
            console.log('[Worker Socket] No existe el registro', event, name)
          }
        }
        exec(0)
      })
    })
  }

  /**
    * Escucha el socket.
    * @returns {Promise<void>}
    */
  async socketListen () {
    // Escucha de eventos de ejecución
    if (this.instances && this.instances.executions) {
      this.instances.executions.on('execute/console', (data) => this.io.in('console').emit('Worker/console', data))
      this.instances.executions.on('execute/client', (data) => this.io.emit('nodeExecuteClient', data))
      this.instances.executions.on('execute/debug', (data) => this.io.emit('execute/debugNode', data))
      this.instances.executions.on('execute/graph', (data) => this.io.emit('execute/graph', data))
      this.instances.executions.on('execute/execute', (data) => this.io.emit('execute/execute', data))
      this.instances.executions.on('execute/pool', (data) => this.io.emit('nodeConnectPool', data))
    }
    // this.io.in(`${name}`).emit('worker/console', data)
  }
}

export { WorkerSocket }
