// EventListener
import fs from 'fs'
import 'dotenv/config'
import { ref, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { EventEmitter } from 'node:events'
import { getScopes } from './workerScope.js'
import { ORM } from '../horizonShare/utils/_orm.js'
import { Modeler } from '../horizonShare/modeler.js'
import { initProperties } from './workerExecuteProperties.ts'
import { WorkerModel } from './application/workerFile.js'
import { WorkerExecuteSubFlows } from './workerExecuteSubFlows.js'
import { backPropagationExec } from './workerExecuteBackPropagation.js'
import { loggerRegister, loggerInstance } from './workerExecuteLogs.js'
import { moduleListServer, serverModuleLoad } from '../horizonShare/plugins/registryServer.js'
import { ContextInterface, ModelInterface, ModelNodeInterface } from '../horizonShare/interface/model.js'

let testData: ModelInterface[] = []
const testExecute = 0

/**
  * Clase que gestiona la ejecución de flujos.
  * @class
  * @classdesc Esta clase proporciona una instancia de ejecución que puede utilizarse
  * para ejecutar flujos de trabajo en una aplicación JavaScript.
  * @property {string} id - Identificador de la ejecución.
  * @property {string} name - Nombre del flujo.
  * @property {Object} context - Contexto del flujo.
  * @property {Object} server - Servidor.
  * @property {Object} execNodesGlobal - Ejecuciones globales. Permite almacenar los datos fuera de la ejecución actual.
  * @property {Object} workerFile - Manejador de archivos.
 */
export class Executions extends EventEmitter {
  isDev: boolean
  isTest: boolean
  useCase: string | null
  name: string
  context: any
  server: any
  serverInstance: any
  moduleList: any
  execStop: boolean
  execNodes: any
  isExecNodesGlobal: boolean
  execNodesGlobal: any
  idExecute: string
  execution: any
  execFinish: any
  workerModel: any

  constructor ({ el }: { el?: any } = {}) {
    super()

    // Inicializando variables
    this.isDev = el?.isDev || false
    this.isTest = el?.isTest || false
    this.useCase = el?.useCase || null
    this.name = el?.name || ''
    this.context = el?.context || null
    this.server = el?.server || null
    this.serverInstance = el?.serverInstance || null
    this.moduleList = el?.moduleList || null
    // Indica si se detiene la ejecución
    this.execStop = false
    // Ejecuciones por nodo
    this.execNodes = {}
    // Ejecuciones globales
    // Se guardan las ejecuciones de los nodos que se han marcado como globales
    this.isExecNodesGlobal = false
    this.execNodesGlobal = el?.execNodesGlobal || {}
    this.idExecute = uuidv4()

    // Datos de instancia de ejecución
    // Se guardan los datos de la ejecución
    this.execution = {
      idExecute: this.idExecute,
      idExecuteParent: el?.idExecute || null,
      store: el?.executionStore || {}
    }

    // Listado de funciones a ejecutar al finalizar la ejecución
    this.execFinish = el?.execFinish || []

    // Modelo del flujo
    this.workerModel = el?.workerModel || new WorkerModel()
  }

  /**
   * Inicializa la ejecución de un flujo.
   * @returns {Object} - Flujo.
   * @property {Function} init - Inicializa la ejecución de un flujo.
   */
  async init ({ server, serverInstance, context, isDev = false, isTest = false, useCase = null }: { server: any, serverInstance: any, context?: any, isDev?: boolean, isTest?: boolean, useCase?: string | null }) {
    // Inicializando variables
    this.isDev = isDev || false
    this.isTest = isTest || false
    this.useCase = useCase || null
    this.context = context || null
    this.server = server || null
    this.serverInstance = serverInstance || null
    this.moduleList = await moduleListServer({ path: 'nodes' })
    this.#initConsole()
  }

  /**
   * initFlow
   * Inicializa un flujo
   * @param {flow} string Nombre del flujo
   * @param {data} Object Datos del flujo
   * @param {input} Object Datos del flujo
   * @param {outputData} Function Funcion de salida del flujo
   */
  async initFlow ({ flow, idNode = null, data = null, input = null, outputData = null, addEnvironment = null } : { flow: string, idNode?: string | null, data?: any, input?: any, outputData?: Function | null, addEnvironment?: any }) {
    // Carga de flujos
    const { model } = await this.workerModel.get({ flow })
    if (!model) return null
    // Asignando nombre
    this.name = model.properties.name
    // Carga de modelo
    const modeler = new Modeler()
    await modeler.modelLoad({ model, moduleList: this.moduleList, moduleLoad: serverModuleLoad })
    // Asignando contexto
    this.context = {
      ...modeler,
      subFlows: model.subFlows || [],
      environment: {
        deploy_local: process.env.FLOW_DEPLOY_LOCAL === 'true',
        isDev: this.isDev,
        env: process.env.NODE_ENV,
        base_url: process.env.BASE_URL,
        path_url: process.env.PATH_URL,
        ...addEnvironment
      },
      store: {},
      logger: loggerInstance({ name: this.name }),
      stopExecute: () => {
        this.execStop = true
      }
    }
    this.context.properties.value.variables = this.#environmentFlow()

    // Registra los inputs de los nodos
    this.#mapInputs({ context: this.context })

    const arr = Object.entries(<ModelNodeInterface> this.context.nodes.value)

    // Cargando datos de test
    if (this.isTest) this.initTest({ file: flow })

    if (!idNode) {
      arr.forEach(([key, value]: [string, ModelNodeInterface]) => {
        if ((!value.interfaz.inputs && !value.disabled) || (value.autoInit)) {
          const idNode = value.id
          this.initExecution({ idNode, data, input, el: this })
        }
      })
    } else {
      this.execFinish = []
      this.execFinish.push(({ nodeC, idNode, output, data, meta }) => {
        if (outputData) outputData(data)
      })
      this.initExecution({ idNode, data, input, el: this })
    }

    return (model)
  }

  /**
   * Inicializa la ejecución de un flujo de prueba.
   *
   * @returns {Object} - Flujo de prueba.
   */
  initTest ({ file }:{ file?: string } = {}) {
    if (fs.existsSync(`${file}/_doc/data.json`)) {
      try {
        const data = JSON.parse(fs.readFileSync(`${file}/_doc/data.json`, 'utf-8'))
        const useCase = data.find(f => f.id === this.useCase)
        const test = useCase.test || []
        testData = test
      } catch (error) {
        console.error(error.toString())
        this.emit('execute/test', false)
      }
    } else {
      this.emit('execute/test', false)
    }
  }

  // ===================================================================================
  // #endregion
  // ===================================================================================

  // INICIADOR DE TODOS LOS NODOS TRIGGER

  /*
  * INICIADOR DE NODOS
  * Inicia un nodo en especifico
  */
  async initExecution ({ idNode, origin, data, input, meta, el }: { idNode: string, origin?: string, data?: any, input?: any, meta?: any, el?: any }) {
    const context = el.#contextHelper({ idNode })
    const execution = el.#executionHelper({ idNode })
    const node = context.nodes.value[idNode]
    if (node.disabled) return false

    const NodeClass = context.nodesClass[node.type].class
    const nodeC = new NodeClass({ ref, watch, ORM })
    nodeC.title = node.title
    // console.log(nodeC.title, node.title)

    nodeC.properties = {
      ...nodeC.properties,
      ...node.properties
    }
    nodeC.context(this, node)

    // Registrando eventos de ejecución
    el.registerExecute({ type: 'input', idNode, data })

    nodeC.callbackCount = 0
    try {
      if (nodeC.properties) nodeC.properties = initProperties({ properties: nodeC.properties, node, input: { data }, context })

      // Metadatos del nodo
      if (!nodeC.meta) {
        const hrTime = process.hrtime()
        nodeC.meta = {
          initTime: parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3)),
          finishTime: 0,
          durationTime: 0,
          accumulativeTime: 0
        }
      }
      if (meta) {
        nodeC.meta.accumulativeTime = meta.durationTime + meta.accumulativeTime
      }

      // Enviando datos de debug
      this.emit('execute/debug', { idExecute: el.idExecute, idParent: origin, name: el.name, node: { id: node.id, title: node.title, properties: nodeC.properties, icon: nodeC.icon }, type: 'input', connectName: input, data })

      const execOutputData = (output, data, meta = null) => {
        // TEST
        if (this.isTest) {
          try {
            const exist = testData.find(test => test.node.id === idNode)
            if (exist && exist.option === 'result') {
              return this.emit('execute/test', data)
            }
            // Si no existen mas output y no es parte del flujo registrado
            if (!exist && testExecute === this.execution.idExecute) {
              return this.emit('execute/test', data)
            }
          } catch (error) {
            this.emit('execute/test', error.toString())
          }
        }

        // Nodo normal sin ejecución multiInstancias
        // Se ejecuta dentro del mismo hilo de la ejecución del trigger
        if (!nodeC.properties.isTrigger?.value && !node.isTrigger) {
          el.initOutputData({ idNode, nodeC, output, data, context, meta })
        } else {
          // Registrando finalización de ejecución anterior
          return this.newExecution(nodeC, idNode, output, data, meta)
        }
      }

      // TEST
      if (this.isTest) {
        const exist = testData.find(test => test.node.id === idNode)
        // console.log('[TEST] ---> ', exist.node.title)
        if (exist && exist.option === 'mock') return execOutputData(exist.connect.connectName, exist.data)
      }

      // Obtenes los scopes
      const scope = await getScopes({ scopes: nodeC.scope })

      nodeC.onExecute({
        scope,
        server: el.server,
        serverInstance: el.serverInstance,
        files: this.workerModel.workDir(),
        execution,
        context,
        inputData: { idNode: origin, data, input },
        outputData: (output, data, meta = null) => {
          execOutputData(output, data, meta)
        },
        outputClient: (data) => this.emit('execute/client', { name: el.name, version: el.version, data: { idNode, data } })

      })
    } catch (error) {
      console.error(error)
    }
  }

  newExecution (nodeC, idNode, output, data, meta) {
    loggerRegister({ el: this, time: nodeC.meta.accumulativeTime + nodeC.meta.durationTime })

    // Iniciando instancia
    const exec = new Executions({ el: this })
    // puente entre la ejecución origen y sus subejecuciones por trigger
    exec.on('execute/execute', (data) => this.emit('execute/execute', data))
    exec.on('execute/client', (data) => this.emit('execute/client', data))
    exec.on('execute/debug', (data) => this.emit('execute/debug', data))
    exec.on('execute/graph', (data) => this.emit('execute/graph', data))
    exec.on('execute/pool', (data) => this.emit('execute/pool', data))
    exec.on('execute/test', (data) => this.emit('execute/test', data))

    // Reiniciando tiempo
    const hrTime = process.hrtime()
    nodeC.meta = {
      initTime: parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3)),
      finishTime: 0,
      durationTime: 0,
      accumulativeTime: 0
    }

    // exec.execNodes
    Object.entries(this.execNodes).forEach(([key, value]) => {
      exec.execNodes[key] = value
    })
    Object.entries(this.execNodesGlobal).forEach(([key, value]) => {
      exec.execNodesGlobal[key] = value
    })

    // exec.execNodes = JSON.parse(JSON.stringify(this.execNodes))
    // exec.execNodesGlobal = JSON.parse(JSON.stringify(this.execNodesGlobal))
    return exec.#nextExecution({ idNode, nodeC, output, data, meta })
  }

  async initOutputData ({ idNode, nodeC, output, data, context, meta = null }:{ idNode: string, nodeC: any, output: string, data: any, context: ContextInterface, meta?: any }) {
    // registrando logger si se tiene la propiedad para registrar salidas erroneas
    if (output && context.properties.config?.logs?.logsError && output.toUpperCase() === 'ERROR') {
      context.logger.error(`${context.nodes.value[idNode].title} - ${typeof data === 'string' ? data : JSON.stringify(data)}`)
    }

    // Deteniendo Ejecución
    if (this.execStop) return

    // Ejecución
    let nextStep = true
    nodeC.callbackCount++
    if (nodeC.callbackCount === 1) nextStep = this.registerExecute({ type: 'output', idNode, data, meta })

    // Buscando salidas
    // Siempre que se cumpla que puede continuar al siguiente nodo
    // nextStep toma el numero de iteraciones que se están ejecutando
    // Si nextStep esta false se buscara el nodo "maxIteration"
    if (!nextStep) {
      const arr = Object.entries(context.nodes.value).filter(([, f]) => f.type === 'others/limitIterations').map(([, node]) => node)
      if (arr && arr[0] && arr[0]) {
        const nodeDestiny = arr[0]
        const destiny = nodeDestiny.id
        await this.initExecution({ idNode: destiny, origin: idNode, data, meta: nodeC.meta, input: nodeDestiny.input, el: this })
      }
      return
    }
    const findOuput = context.nodes.value[idNode].connect.filter(f => f.output === output)
    // Si no existen mas output
    // registrando metadata de la ejecución por nodo
    const hrTime = process.hrtime()
    nodeC.meta.finishTime = parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3))
    nodeC.meta.durationTime = nodeC.meta.finishTime - nodeC.meta.initTime

    this.emit('execute/debug', { idExecute: this.idExecute, name: this.name, node: { id: idNode, title: nodeC.title, icon: nodeC.icon, type: context.nodes.value[idNode].type }, type: 'output', connectName: output, data, time: { durationTime: nodeC.meta.durationTime.toFixed(3), accumulativeTime: (nodeC.meta.accumulativeTime + nodeC.meta.durationTime).toFixed(3) } })

    if (findOuput.length === 0) {
      this.#finishExecution({ nodeC, idNode, output, data, meta: nodeC.meta })
      this.emit('execute/graph', { accumulativeTime: (nodeC.meta.accumulativeTime + nodeC.meta.durationTime).toFixed(3) })
      loggerRegister({ el: this, time: nodeC.meta.accumulativeTime + nodeC.meta.durationTime })
    }
    // ejecutando el backPropagation
    backPropagationExec({ context })

    findOuput.forEach(async nodeDestiny => {
      const destiny = nodeDestiny.id
      this.#outputEmit({ nodeDestiny, uniqueOrigin: idNode, output, data, meta: nodeC.meta })
      await this.initExecution({ idNode: destiny, origin: idNode, data, meta: nodeC.meta, input: nodeDestiny.input, el: this })
    })
  }

  /**
   * registerExecute
   * Determina las metricas de cada ejecución y de un nodo en concreto
   * @param {type} string Tipo de ejecución (input,output)
   * @param {idNode} string Id del nodo
   * @param {data} string valor devuelto por el nodo
   * @param {meta} string valor devuelto por el nodo
   * @returns boolean (Devuelve si se continua o no con la ejecución)
   */
  registerExecute ({ type, idNode, data, meta = null }:{ type: string, idNode: string, data: any, meta?: any }) {
    let nextStep = true
    const iterations = this.context.properties.value.config?.advance?.iteration
    // Verifica si se debe validar las iteraciones
    let verifyIterations = this.context.properties.value.config?.advance?.verifyIteration
    verifyIterations = verifyIterations === undefined ? true : verifyIterations

    const node = this.context.nodes.value[idNode]
    if (!node) return false

    if (!node.metrics?.counts) node.metrics = { counts: { inputs: 0, outputs: 0 } }

    if (type === 'input') node.metrics.counts.inputs++
    if (type === 'output') node.metrics.counts.outputs++

    this.emit('execute/execute', { name: this.name, data: { idNode, metrics: node.metrics } })

    /**
     * REGISTRANDO NUEVA EJECUCIÓN
     */
    if (type === 'output') {
      if (!this.execNodes[idNode]) this.execNodes[idNode] = {}
      if (!this.execNodes[idNode].countExec) this.execNodes[idNode].countExec = 0
      this.execNodes[idNode].data = data
      this.execNodes[idNode].meta = meta
      if (verifyIterations) this.execNodes[idNode].countExec++

      // Validando ejecución global en el flujo
      // Guarda la información directamente en el flujo y no por ejecución
      if (meta?.globalExec) this.isExecNodesGlobal = true
      // Indica si el siguiente nodo es un trigger (separa las ejecuciones para no seguir el mismo hilo)
      if (meta?.nextIsTrigger) {
        node.connect.forEach(f => {
          this.context.nodes.value[f.id].isTrigger = true
        })
      }

      if (this.isExecNodesGlobal) {
        this.execNodesGlobal[idNode] = { data, meta }
      }

      // Validando iteraciones
      if (verifyIterations && iterations && this.execNodes[idNode].countExec > iterations) nextStep = false
    }
    return nextStep
  }
  // ===================================================================================
  // #region Helpers
  // ===================================================================================

  #nextExecution ({ idNode, nodeC, output, data, meta = null }) {
    if (!this.context) return
    const node = this.context.nodes.value[idNode]
    if (!node) return false
    // Registrando eventos de ejecución
    this.registerExecute({ type: 'output', idNode, data, meta })

    const hrTime = process.hrtime()
    nodeC.meta.finishTime = parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3))
    nodeC.meta.durationTime = parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3)) - nodeC.meta.initTime

    this.emit('execute/debug', { idExecute: this.idExecute, name: this.name, node: { id: idNode, title: nodeC.title, icon: nodeC.icon, type: node.type }, type: 'output', connectName: output, data, time: { durationTime: nodeC.meta.durationTime.toFixed(3), accumulativeTime: nodeC.meta.accumulativeTime.toFixed(3) } })

    const findOuput = node.connect.filter(f => f.output === output)
    findOuput.forEach(async nodeDestiny => {
      const destiny = nodeDestiny.id
      this.#outputEmit({ nodeDestiny, uniqueOrigin: idNode, output, data })
      await this.initExecution({ idNode: destiny, data, origin: idNode, input: nodeDestiny.input, el: this })
    })
  }

  #outputEmit ({ nodeDestiny, uniqueOrigin, output, data, meta }: { nodeDestiny: any, uniqueOrigin: string, output: string, data: any, meta?: any }) {
    // Enviando datos de debug
    // const node = this.context.nodes.value[uniqueOrigin]
    // if (HermesServer) HermesServer.flowsNodesDebug({ idExecute: this.idExecute, name: this.name, node: { id: node.id, title: node.title, icon: node.icon }, type: 'output', connectName: output, data, time: { durationTime: meta?.durationTime, accumulativeTime: meta?.accumulativeTime } })

    // Agregando envio de conexiones visuales
    const pool = {
      origin: uniqueOrigin,
      destiny: nodeDestiny.id,
      input: nodeDestiny.input,
      inputIndex: this.context.nodes.value[nodeDestiny.id].interfaz.inputs.findIndex(f => f === nodeDestiny.input),
      output: nodeDestiny.output,
      outputIndex: this.context.nodes.value[uniqueOrigin].interfaz.outputs.findIndex(f => f === nodeDestiny.output),
      time: 0,
      active: true
    }

    this.emit('execute/pool', { name: this.name, pool })
  }

  /**
   * mapInputs
   * Mapea los inputs de los nodos para poder validar el nodo origen de la llamada
   * funciona para nodo paralelo
   * @param {*} param0
   */
  #mapInputs ({ context }) {
    if (!context.inputs) context.inputs = {}
    const arr = Object.entries(<ModelNodeInterface> context.nodes.value)
    arr.forEach(([key, value]:[string, ModelNodeInterface]) => {
      value.connect.filter(f => f.input).forEach(input => {
        if (!context.inputs[input.id]) context.inputs[input.id] = []
        if (!context.nodes.value[key].disabled)context.inputs[input.id].push({ key, input: input.input })
      })
    })
  }

  #initConsole () {
    const cl = console.log
    console.log = (...args) => {
      this.emit('execute/console', args)
      cl.apply(console, args)
    }
  }

  #contextHelper ({ idNode }) {
    return {
      ...this.context,
      // Indica si se ha ejecutado el nodo anteriormente
      idNode,
      isTest: this.isTest,
      ifExecute: () => {
        return !!this.execNodes[idNode]
      },
      // Obtiene contexto del nodo por nombre
      getNodeByName: (nameNode) => {
        const arr = this.context.nodesName[nameNode]
        if (arr) return this.execNodes[arr] || this.execNodesGlobal[arr]
        return null
      },
      // Obtiene contexto del nodo por tipo
      getNodeByType: (typeNode, index = 0) => {
        const arr = Object.entries(this.execNodes).filter(f => this.context.nodes.value[f[0]].type === typeNode)
        if (arr && arr[index]) return arr[index][1]
        return null
      },
      // Obtiene contexto del nodo por tipo
      getNodeById: ({ idNode, onlyExec = true }) => {
        const arr = (onlyExec) ? this.execNodes[idNode] : this.context.nodes.value[idNode]
        if (arr) return arr
        return null
      },
      // Asigna valor a un store del nodo
      setValue: ({ obj, value, idNodeObj }) => {
        if (!this.context.store[idNodeObj || idNode]) this.context.store[idNodeObj || idNode] = {}
        this.context.store[idNodeObj || idNode][obj] = value
      },
      // Obtiene valor de un store del nodo
      getValue: ({ obj, idNodeObj }) => {
        if (!this.context.store[idNodeObj || idNode]) return null
        if (obj && !this.context.store[idNodeObj || idNode][obj]) return null
        if (!obj) return this.context.store[idNodeObj || idNode]
        return this.context.store[idNodeObj || idNode][obj]
      },
      // Asigna valor a un store global
      setStore: (obj, value) => {
        this.context.store[`store__${obj}`] = value
      },
      // Obtiene valor de un store global
      getStore: (obj) => {
        return this.context.store[`store__${obj}`]
      },
      subFlow: ({ idFlow, idSubFlow, idNode, data, outputData, outputDefault }) => {
        WorkerExecuteSubFlows({ idFlow, idSubFlow, idNode, data, outputData, outputDefault, el: this })
      }
    }
  }

  #executionHelper ({ idNode }) {
    return {
      ...this.execution,
      // Indica si se ha ejecutado el nodo anteriormente
      idNode,
      // Asigna valor a un store del nodo
      setValue: ({ obj, value, idNodeObj }) => {
        if (!this.execution.store[idNodeObj || idNode]) this.execution.store[idNodeObj || idNode] = {}
        this.execution.store[idNodeObj || idNode][obj] = value
      },
      // Obtiene valor de un store del nodo
      getValue: ({ obj, idNodeObj }) => {
        if (!this.execution.store[idNodeObj || idNode]) return null
        if (obj && !this.execution.store[idNodeObj || idNode][obj]) return null
        if (!obj) return this.execution.store[idNodeObj || idNode]
        return this.execution.store[idNodeObj || idNode][obj]
      },
      // Asigna valor a un store global
      setStore: (obj, value) => {
        this.execution.store[`store__${obj}`] = value
      },
      // Obtiene valor de un store global
      getStore: (obj) => {
        return this.execution.store[`store__${obj}`]
      }
    }
  }

  #environmentFlow ({ file }:{ file?: string } = {}) {
    const path = `./${file}/flow.conf`
    const variables = {}
    if (fs.existsSync(path)) {
      try {
        const data = JSON.parse(fs.readFileSync(`${path}`, 'utf-8'))
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            variables[key] = value
          })
        }
      } catch (error) {
        console.log('environmentFlow', error.toString())
      }
    }
    return variables
  }

  #finishExecution ({ nodeC, idNode, output, data, meta }) {
    const hrTime = process.hrtime()
    nodeC.meta.finishTime = parseFloat((hrTime[0] * 1000 + hrTime[1] / 1000000).toFixed(3))
    nodeC.meta.durationTime = nodeC.meta.finishTime - nodeC.meta.initTime
    this.execFinish.forEach(f => {
      f({ nodeC, idNode, output, data, meta })
    })
  }
}
