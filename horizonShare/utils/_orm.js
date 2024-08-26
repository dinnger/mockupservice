import { ref, watch } from 'vue'
import nodosProperties from './_ormNodos.json'
import { socket } from '../store/storeSocket.js'

export class ORM {
  constructor (nodo) {
    this.nodo = nodo
    this.properties = {
      type: {
        label: 'Tipo de conexión:',
        type: 'options',
        options: [
          {
            label: 'Conexión Preestablecida',
            value: 'dataSource'
          }, {
            label: 'Manual',
            value: 'manual'
          }
        ],
        value: 'manual'
      },
      basic: {
        type: 'group',
        object: {},
        value: null,
        show: ref(false)
      },
      credential: {
        type: 'group',
        object: {
          persistence: {
            label: 'Persistencia:',
            type: 'options',
            size: 1,
            description: 'Tipo de persistencia de la conexión <br>*Temporal: La conexión se restablece en cada llamada al nodo <br>*Permanente: Se mantiene la conexión abierta para su reutilización',
            options: [
              {
                label: 'Temporal',
                value: 'temporal'
              }, {
                label: 'Permanente',
                value: 'permanente'
              }
            ],
            value: 'temporal'
          },
          tags: {
            label: 'Tag',
            type: 'options',
            size: 3,
            options: [],
            actions: [
              {
                icon: 'mdi-refresh',
                tooltip: 'Refrescar listado',
                click: this.loadCredentials().load
              },
              {
                icon: 'mdi-plus-thick',
                tooltip: 'Creación de credenciales',
                click: ({ dynamicComponent }) => this.newCredentials({ el: this, dynamicComponent })
              }
            ],
            value: ''
          }
        },
        value: null,
        show: ref(false)
      },
      query: {
        label: 'Query:',
        type: 'code',
        lang: ['sql', 'sql'],
        value: ''
      }
    }
    this.propertyORM()
  }

  propertyORM () {
    this.properties.basic.object = {}
    const object = nodosProperties[this.nodo]
    if (!object) return
    this.properties.basic.object.config = {
      label: 'Configuración',
      type: 'code',
      lang: ['json', 'JSON'],
      value: JSON.stringify(object, null, 2)
    }
    // Object.entries(object).forEach(([key, value]) => {
    //   if (Array.isArray(value)) {
    //     const val = value[2] || ''
    //     this.properties.basic.object[value[0]] = {
    //       label: value[1],
    //       type: Number.isInteger(val) ? 'number' : 'string',
    //       value: val
    //     }
    //   } else {
    //     this.properties.basic.object[value] = {
    //       label: value,
    //       type: 'string',
    //       value: ''
    //     }
    //   }
    // })
  }

  newCredentials ({ el, dynamicComponent }) {
    const { setComponent, setComponentValue } = dynamicComponent
    setComponentValue({ node: el.nodo })
    setComponent('orm')
  }

  loadCredentials () {
    const nodo = this.nodo

    const load = async () => {
      const list = []
      socket.emit('WorkerSecurity/list', { node: nodo }, value => {
        value.forEach(element => {
          list.push({ label: element.tag, value: `${element.tag}_${element.token}` })
        })
        this.properties.credential.object.tags.options.value = list
      })
    }
    return { load }
  }

  onCreateORM () {
    this.properties.type.value = ref(this.properties.type.value)
    this.properties.credential.object.tags.options = ref(this.properties.credential.object.tags.options)

    const update = () => {
      this.properties.basic.show.value = false
      this.properties.credential.show.value = false

      if (this.properties.type.value.value === 'manual') {
        this.properties.basic.show.value = true
      }
      if (this.properties.type.value.value === 'dataSource') {
        this.properties.credential.show.value = true
        this.loadCredentials().load()
      }
    }
    watch(this.properties.type.value, () => update())
    update()
  }

  async getConfigORM ({ properties, context }) {
    let config = {}

    if (properties.type.value === 'manual') {
      if (properties.basic.value !== null) {
        Object.entries(properties.basic.value).forEach(([key, value]) => {
          if (key === 'config') {
            config = JSON.parse(value.value)
          } else {
            config[key] = value.value
          }
        })
      }
      // config = {
      //   host: properties.basic.value?.host?.value,
      //   user: properties.basic.value?.user?.value,
      //   password: properties.basic.value?.password?.value,
      //   timeout: properties.basic.value?.timeout?.value
      // }
    }

    if (properties.type.value === 'dataSource') {
      const { getCredential } = await import('../../horizonWorker/workerORM.js')
      const value = properties.credential.value.tags.value.split('_')
      const token = value.pop()
      const tag = value.join('_')
      await getCredential({ tag, token })
        .then(resp => {
          // if (resp?.host) {
          config = resp
          // }
        })
        .catch(err => {
          console.log(err)
        })
    }
    const idStore = properties.credential.value?.tags.value
    const permanente = properties.credential.value?.persistence?.value === 'permanente'
    const setStore = (value) => { context.store[idStore] = value }
    const getStore = () => context.store[idStore]
    const deleteStore = () => { delete context.store[idStore] }
    const retryStore = (callback, args) => {
      deleteStore()
      context.retry = true
      callback.onExecute(args)
    }

    return { config, validStore: properties.type.value === 'dataSource' && !!idStore && permanente, setStore, getStore, deleteStore, retryStore }
  }
}
