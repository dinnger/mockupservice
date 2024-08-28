import { ref, watch } from 'vue'
import { ORM } from './utils/_orm.js'

/**
 * Clase que representa un conjunto de nodos y sus funcionalidades asociadas.
 * @class
 */
export class Modeler {
  /**
   * Crea una instancia de GraphNodes.
   * @constructor
   * @param {Object} options - Opciones para la inicialización de GraphNodes.
   * @param {string} options.name - Nombre del conjunto de nodos.
   * @param {string} options.version - Versión del conjunto de nodos.
   */
  constructor ({ origin = 'server' } = {}) {
    this.origin = origin

    // Si existen cambios
    this.change = ref(false)

    this.nodesClass = []
    this.nodes = ref({})
    this.nodesName = []
    this.nodeMetrics = ref({})

    this.nodeFocus = ref(null)
    this.nodeSelect = null
    this.nodeProperties = ref(null)

    this.nodeExecutePool = [] // Listado de nodos en ejecución
    this.nodeConnects = []
    this.nodeConnectPool = [] // Listado de conexiones pendientes de llamar
    this.nodeConnectHistory = ref([]) // Historial

    this.groupSelect = null
    this.groupFocus = null
    this.groups = ref([])

    this.environment_global = {} // Environment del server y base_url del server (.env)
    this.properties = ref({})

    this.loadModelStatus = false
    // Objeto base del node
    this.nodeBase = {
      interfaz: {},
      connect: [],
      properties: {},
      metrics: {}
    }
    // new connect
    this.newConnect = {
      nodeOrigin: null,
      nodeOriginIndex: 0
    }

    this.fnExternal = null
  }

  /**
   * Registra un nuevo tipo de nodo para su uso en el conjunto.
   * La función `nodeRegister` se utiliza para registrar una nueva clase de nodo con sus propiedades y
   * métodos asociados.
   * @returns No se devuelve nada en este código. Está definiendo una función llamada `nodeRegister`
   * que agrega propiedades y métodos a un objeto `NodeClass`.
   * @param {Object} config - Configuración del nodo a registrar.
   * @param {string} config.group - Grupo al que pertenece el nodo.
   * @param {string} config.title - Título del nodo.
   * @param {string} config.icon - Icono asociado al nodo.
   * @param {string} config.nodeType - Tipo de nodo a registrar.
   * @param {Function} config.NodeClass - Clase del nodo a registrar.
   */
  nodeRegister ({ group, title, icon, nodeType, NodeClass, color }) {
    NodeClass.prototype.context = function (ctx, node) {
      this.exec = ctx
      this.node = node
    }
    NodeClass.prototype.addInput = function (name) {
      if (!this.interfaz) this.interfaz = {}
      if (!this.interfaz.inputs) this.interfaz.inputs = []
      if (this.interfaz.inputs.find(f => f === name)) return console.error('Input previamente ingresado')
      this.interfaz.inputs.push(name)
    }
    NodeClass.prototype.addOutput = function (name) {
      if (!this.interfaz) this.interfaz = {}
      if (!this.interfaz.outputs) this.interfaz.outputs = []
      if (this.interfaz.outputs.find(f => f === name)) return console.error('Output previamente ingresado')
      this.interfaz.outputs.push(name)
    }
    this.nodesClass[nodeType] = {
      group,
      title,
      icon,
      color,
      class: NodeClass
    }

    // Ordenar nodeClass por group
    this.nodesClass = Object.entries(this.nodesClass).sort((a, b) => {
      if (a[1].group < b[1].group) return -1
      if (a[1].group > b[1].group) return 1
      return 0
    }).reduce((acc, curr) => {
      acc[curr[0]] = curr[1]
      return acc
    }, {})
  }

  /**
   * Agrega un nuevo nodo al conjunto.
   * @param {string} type - El tipo de nodo.
   * @param {number} x - La posición en el eje X.
   * @param {number} y - La posición en el eje Y.
   * @param {Object} properties - Las propiedades del nodo (opcional).
   * @returns {string} - El identificador único del nodo creado.
   */
  async nodeAdd ({ type, x, y, properties = null }) {
    const { v4 } = await import('uuid')
    this.change.value = true
    x = x ? parseFloat(x.toFixed(1)) : 0
    y = y ? parseFloat(y.toFixed(1)) : 0

    try {
      if (typeof properties === 'string') properties = JSON.parse(properties)
    } catch (error) {
      properties = null
    }

    if (this.nodesClass[type]) {
      const unique = v4()
      this.nodes.value[unique] = { id: unique }
      const node = this.nodes.value[unique]
      const NodeClass = this.nodesClass[type].class
      // posición
      node.pos = {
        x: 0, y: 0, w: 0, h: 0
      }

      // Llenando datos bases
      Object.entries(structuredClone(this.nodeBase))
        .forEach(([key, value]) => { node[key] = value })

      // Iniciando clase
      const nodeC = new NodeClass({ ref, watch, ORM })

      // Remplazando todos los valores del nodo por la clase
      Object.entries(nodeC)
        .forEach(([key, value]) => {
          node[key] = value
          if (key === 'properties') {
            node[key] = {
              ...node[key]
            }
          }
        })

      // validando nombre
      const title = structuredClone(node.title)
      let titleIndex = 1
      const validName = (title) => {
        const existName = Object.entries(this.nodes.value).map(m => m[1]).find(f => f.title === title && f.id !== unique)
        if (existName) {
          titleIndex++
          validName(`${node.title} ${titleIndex}`)
        } else {
          node.title = title
        }
      }
      validName(title)

      node.type = type
      node.pos.x = x
      node.pos.y = y
      node.pos.w = 90
      node.pos.h = 90

      // asignación de funciones de la clase al nodo
      this.nodeExec({ node, nodeC })

      // iniciando evento onCreate
      if (node?.exec?.onCreate) node.exec.onCreate()

      // Remplazando todos los valores del nodo por la clase
      if (properties) {
        Object.entries(node.properties).forEach(([key2, value2]) => {
          if (properties[key2]) {
            node.properties[key2].value = properties[key2].value ?? properties[key2]
          }
        })
      }

      this.nodesName[node.title] = unique
      return unique
    }
  }

  /**
   * Actualiza un nodo del conjunto.
   * @param {string} id - El identificador único del nodo a actualizar.
   * @param {Object} pos - La nueva posición del nodo.
   */
  nodeUpdate ({ id, x, y, properties, connect }) {
    const node = this.nodes.value[id]
    if (x) node.pos.x = x
    if (y) node.pos.y = y
    if (properties) {
      try {
        properties = JSON.parse(properties)
        Object.entries(properties).forEach(([key2, value2]) => {
          if (node.properties[key2]) {
            node.properties[key2].value = value2.value || value2
          }
        })
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  /**
   * Elimina un nodo del conjunto.
   * @param {string} id - El identificador único del nodo a eliminar.
   * @returns {boolean} - Verdadero si el nodo fue eliminado, falso en caso contrario.
   */
  nodeRemove (id) {
    delete this.nodes.value[id]
  }

  // modeler.nodeMove(uuid, { x: 30, y: 40 })
  /**
   * Mueve un nodo a una nueva posición.
   * @param {string} id - El identificador único del nodo a mover.
   * @param {Object} pos - La nueva posición del nodo.
   */
  nodeMove (id, pos) {
    const node = this.nodes.value[id]
    node.pos.x = pos.x
    node.pos.y = pos.y
  }

  /**
   * Asocia la ejecución de un nodo con su clase correspondiente.
   * @param {Object} param0 - El nodo al que se asociará la ejecución.
   * @param {Object} param1 - La clase del nodo.
   * @param {Object} param2 - El componente dinámico asociado a la interfaz (ClientInterfaz) (opcional).
   */
  nodeExec ({ node, nodeC }) {
    node.exec = {
      onCreate: () => {
        if (!nodeC.onCreate) return null

        // Se asocia el contexto del flujo
        const context = {
          nodes: this.nodes,
          name: this.properties.value.name,
          environment: this.environment_global,
          properties: this.properties,
          fnExternal: this.fnExternal
        }

        try {
          nodeC.onCreate({ context })
        } catch (error) {
          console.log('🐛', node.title, error)
        }
        // Eliminación de la función al ser llamada
        node.exec.onCreate = null
      }
    }
  }

  /**
   * Conecta dos nodos.
   * @param {string} origin - El identificador del nodo de origen.
   * @param {string} originOutput - El nombre del output en el nodo de origen.
   * @param {string} destiny - El identificador del nodo de destino.
   * @param {string} destinyInput - El nombre del input en el nodo de destino.
   * @returns {boolean} - Verdadero si la conexión fue exitosa, falso en caso contrario.
   */
  nodeConnect ({ origin, originOutput, destiny, destinyInput }) {
    const nodeA = this.nodes.value[origin]
    const nodeB = this.nodes.value[destiny]
    if (nodeA && nodeB) {
      // Validando si existe el input y el output
      if (nodeA.interfaz.outputs && nodeA.interfaz.outputs.find(f => f === originOutput) &&
      nodeB.interfaz.inputs && nodeB.interfaz.inputs.find(f => f === destinyInput)) {
        if (!this.nodeConnects[origin]) this.nodeConnects[origin] = []
        this.nodeConnects[nodeA.id].push(destiny)
        nodeA.connect.push({
          id: nodeB.id,
          output: originOutput,
          input: destinyInput
          // pos: nodeB.pos
        })
      } else {
        console.log('No se logro relacionar los nodos')
      }
    }
    return false
  }

  /**
   * Ejecuta un nodo.
   * @param {string} idNode - El identificador único del nodo a ejecutar.
   * @param {string} idExecute - El identificador único de la ejecución (opcional).
   * @param {string} origin - El nodo de origen (opcional).
   * @param {Object} metrics - Las métricas del nodo (opcional).
   */
  nodeExecute ({ idNode, metrics = null }) {
    const node = this.nodes.value[idNode]
    if (!node) return false
    if (metrics) this.nodeMetrics[idNode] = metrics
  }

  /**
   * Ejecuta un nodo del tipo cliente.
   * @param {string} idNode - El identificador único del nodo a ejecutar.
   * @param {Object} data - Los datos para la ejecución.
   */
  nodeExecuteClient ({ idNode, data }) {
    if (!this.nodesClass) return false
    const node = this.nodes.value[idNode]
    const NodeClass = this.nodesClass[node.type].class
    const nodeC = new NodeClass()
    nodeC.title = node.title
    if (nodeC.onExecuteClient) nodeC.onExecuteClient(data)
  }

  /**
   * Ejecuta nodos de un tipo específico.
   * @param {string} type - El tipo de nodo a ejecutar.
   * @param {Object} data - Los datos para la ejecución.
   */
  nodeExecuteType ({ type, data }) {
    Object.entries(this.nodes.value).forEach(([key, value]) => {
      if (value.type === type) this.nodeExecute({ idNode: value.id, data })
    })
  }

  /**
   * Devuelve un arreglo de todos los nodos en el conjunto.
   * @returns {Array} - Arreglo de nodos.
   */
  nodeEach () {
    return Object.entries(this.nodes.value).map(m => m[1])
  }

  /**
   * Obtiene el historial de conexiones de los nodos.
   * @returns {Array} - Historial de conexiones.
   */
  nodeHistory () {
    return this.nodeConnectHistory.value
  }

  /**
   * Actualiza el nodo focalizado.
   * @param {Object} pos - Posición de referencia.
   */
  nodeFocusUpdate (pos) {
    const _nodes = this.nodeEach()
    const posNode = (f) => f.pos.x < pos.x && f.pos.y < pos.y && f.pos.x + f.pos.w > pos.x && parseFloat(f.pos.y) + parseFloat(f.pos.h) > pos.y

    this.nodeFocus.value = _nodes.find(f => posNode(f))
  }

  /**
   * Actualiza el nodo seleccionado.
   * @param {Object} obj - Objeto de referencia.
   */
  nodeSelectUpdate (obj) {
    this.nodeSelect = JSON.parse(JSON.stringify(obj))
  }

  /**
   * Muestra las propiedades del nodo focalizado.
   * @param {boolean} clear - Indica si se deben borrar las propiedades existentes (opcional).
   */
  nodeShowProperties (clear = false) {
    if (!clear) {
      this.nodeProperties.value = this.nodeFocus.value

      // iniciando evento onCreate
      if (this.nodeFocus.value?.exec?.onCreate) this.nodeFocus.value.exec.onCreate()

      return false
    }
    this.nodeProperties.value = null
    this.nodeFocus.value = null
    this.nodeSelect = null
  }

  /**
   * Agrega un nuevo grupo al conjunto.
   * @param {number} x - La posición en el eje X.
   * @param {number} y - La posición en el eje Y.
   * @param {number} h - La anchura.
   * @param {number} w - La altura.
   * @param {Object} properties - Las propiedades del grupo (opcional).
   * @returns {string} - El identificador único del grupo creado.
   */
  async groupAdd ({ x, y, h, w, properties = null }) {
    const { v4 } = await import('uuid')
    x = parseFloat(x.toFixed(1))
    y = parseFloat(y.toFixed(1))

    const unique = v4()
    this.groups.value[unique] = { id: unique }
    const groups = this.groups.value[unique]
    // posición
    groups.pos = {
      x: 0, y: 0, w: 0, h: 0
    }

    groups.pos.x = x
    groups.pos.y = y
    groups.pos.w = w
    groups.pos.h = h

    return unique
  }

  groupFocusUpdate (pos) {
    const _groups = Object.entries(this.groups.value).map(m => m[1])
    const margin = 3
    const posNode = (f) => f.pos.x + f.pos.w - margin - 20 < pos.x && f.pos.x + f.pos.w + margin > pos.x && f.pos.y - margin < pos.y && parseFloat(f.pos.y) + 20 + margin > pos.y
    this.groupFocus = _groups.find(f => posNode(f))
  }

  /**
   * Actualiza el grupo seleccionado.
   * @param {Object} obj - Objeto de referencia.
   */
  groupSelectUpdate (obj) {
    if (obj === null) {
      // Corrección de posición
      const group = this.groups.value[this.groupSelect.id]
      if (group.pos.w < 0) {
        group.pos.x += group.pos.w
        group.pos.w = Math.abs(group.pos.w)
      }
      if (group.pos.h < 0) {
        group.pos.y += group.pos.h
        group.pos.h = Math.abs(group.pos.h)
      }
    }
    this.groupSelect = JSON.parse(JSON.stringify(obj))
  }

  groupAddNode (group) {
    // Asignación de nodos al grupo
    group.nodes = []
    Object.entries(this.nodes.value).forEach(([nodeId, node]) => {
      const pos = node.pos
      if (pos.x > group.pos.x && pos.x + pos.w < group.pos.x + group.pos.w) {
        if (pos.y > group.pos.y && pos.y + pos.h < group.pos.y + group.pos.h) {
          group.nodes.push(nodeId)
        }
      }
    })
  }

  groupRemoveNode (group) {
    group.nodes = []
  }

  groupRemove (group) {
    delete this.groups.value[group.id]
  }

  /**
   * Carga un modelo en el conjunto.
   * La función `modelLoad` carga un modelo en el conjunto de nodos. El modelo puede ser de tipo `flow` o
   * `process`, y puede contener un entorno y un componente dinámico.
   * @param {Object} param0 - El modelo a cargar.
   * @param {string} param0.model - El modelo a cargar.
   * @param {string} param0.type - El tipo de modelo (opcional).
   * @param {Object} param0.environment - El entorno del modelo (opcional).
   * @param {Object} param0.moduleList - La lista de registros de nodos (opcional).
   * @param {Function} param0.moduleLoad - La función para cargar un módulo (opcional).
   * @returns {boolean} - Verdadero si el modelo fue cargado, falso en caso contrario.
   */
  async modelLoad ({ model, environment = null, moduleList, moduleLoad, fnExternal = null } = {}) {
    if (!model) return false

    const registryClass = async (arr, index = 0) => {
      if (index === arr.length) return
      const element = arr[index]

      const GraphRegistry = await moduleLoad({ path: 'nodes', uuid: element.uuid })
      if (!GraphRegistry) {
        console.warn('Error', element)
        return
      }
      GraphRegistry.prototype.addInput = () => { }
      GraphRegistry.prototype.addOutput = () => { }

      const registry = new GraphRegistry({ ref, watch, ORM })
      const dir = element.path.replace('nodes/', '').replace('.js', '')
      this.nodeRegister({
        nodeType: dir,
        NodeClass: GraphRegistry,
        group: registry.group || 'Sin asignar',
        title: registry.title,
        icon: registry.icon,
        color: registry.color || '#27AE60'
      })
      await registryClass(arr, index + 1)
    }

    await registryClass(moduleList, 0)

    // const { GraphRegistry } = await import(`./nodes/${type}/registry.js`)
    // GraphRegistry(this)

    this.environment_global = environment
    this.nodes.value = []
    this.nodeConnectPool = [] // Listado de conexiones pendientes de llamar
    this.nodeConnectHistory.value = [] // Historial
    this.properties.value = model.flow || model.process || model.properties || {}
    this.fnExternal = fnExternal

    model.nodes.forEach(node => {
      let nodeC = null
      try {
        // eslint-disable-next-line new-cap
        nodeC = new this.nodesClass[node.type].class({ ref, watch, ORM })
      } catch (error) {
        node.type = 'input_output/none'
        // eslint-disable-next-line new-cap
        nodeC = new this.nodesClass['input_output/none'].class({ ref, watch, ORM })
        node.title = nodeC.title
        node.icon = nodeC.icon
        node.desc = nodeC.desc
      }

      // Enlazando propiedades
      const propertyC = nodeC.properties
      if (propertyC) {
        Object.entries(propertyC).forEach(([key, item]) => {
          if (node.properties && node.properties[key]) {
            // if (item.options !== undefined) item.options = node.properties[key].options
            item.value = node.properties[key].value
          }
        })
      }
      node.properties = propertyC

      // Enlazando interfaz
      const interfaz = nodeC.interfaz
      if (interfaz) {
        interfaz.inputs = node.interfaz.inputs
        interfaz.outputs = node.interfaz.outputs
      }
      node.interfaz = interfaz

      // Asociando ejecuciones
      if (this.origin === 'client' && nodeC.onCreate) this.nodeExec({ node, nodeC })

      this.nodes.value[node.id] = node
      this.nodesName[node.title] = node.id
    })

    if (this.origin === 'client') {
      model.nodes.filter(node => node?.exec?.onCreate).forEach(node => {
        node.exec.onCreate()
      })
    }

    if (model.groups) {
      model.groups.forEach(group => {
        this.groups.value[group.id] = group
      })
    }

    return true
  }

  /**
   * Carga de subFlows
   * @param {*} subFlows
   */
  async modelLoadSubFlows ({ subFlows }) {
    this.subFlows = subFlows
  }

  /**
   * La función `modelSave` devuelve un objeto JSON que contiene las propiedades, nodos y grupos de un
   * modelo, con ciertas propiedades y valores modificados o eliminados.
   * @returns La función `modelSave()` devuelve un objeto que contiene las siguientes propiedades:
   * - `properties` - Un objeto que contiene las propiedades del modelo.
   * - `nodes` - Un arreglo que contiene los nodos del modelo.
   * - `groups` - Un arreglo que contiene los grupos del modelo.
   */
  modelSave () {
    const list = []
    const subFlows = []

    this.change.value = false
    Object.entries(this.nodes.value).forEach(m => {
      list[m[0]] = JSON.parse(JSON.stringify(m[1]))
    })

    // SubFlows
    Object.entries(list).forEach(m => {
      const dat = m[1]
      if (dat.type === 'input_output/subFlow') {
        const id = dat.properties.flow.value
        const flow = dat.properties.flow.options.find(f => f.value === id)?.label
        const node = dat.properties.node.value
        if (!flow) return
        subFlows.push({ id, flow, node })
      }
    })

    const properties = {
      ...this.properties.value
    }

    const nodes = Object.entries(list).map(m => {
      const dat = m[1]
      delete dat.metrics
      delete dat.data
      delete dat.exec
      delete dat.orm
      if (dat.properties) {
        Object.entries(dat.properties).forEach(([key, item]) => {
          if (item.type === 'group' && item.value) {
            Object.entries(item.value).forEach(([key2, item2]) => {
              if (typeof dat.properties[key].value !== 'object') dat.properties[key].value = {}
              dat.properties[key].value[key2] = { value: item2.value }
            })
            delete dat.properties[key].object
          } else if (item.type === 'list') {
            if (item.value && item.value.length > 0) {
              item.value.forEach((item2, key2) => {
                Object.entries(item2).forEach(([key3, item3]) => {
                  dat.properties[key].value[key2][key3] = { value: item3.value }
                })
              })
            }
            delete dat.properties[key].object
          } else {
            dat.properties[key] = { value: item.value }
          }
        })
      }
      return {
        ...dat,
        connect: dat.connect.map(m => { return { id: m.id, output: m.output, input: m.input } })
      }
    })

    const groups = Object.entries(this.groups.value).map(m => {
      return { ...m[1] }
    })

    return {
      properties,
      nodes,
      subFlows,
      groups
    }
  }

  changeState () {
    this.change.value = true
  }

  getNodesClass () {
    return Object.entries(this.nodesClass).map(m => {
      return {
        group: m[1].group,
        title: m[1].title,
        icon: m[1].icon,
        type: m[0]
      }
    })
  }

  getNodes () {
    return Object.entries(this.nodes.value).map(([key, value]) => {
      return value
    })
  }
}
