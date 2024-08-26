<template>
  <!-- <div class="content">
    <img  :src="banner" alt="">
    <img  :src="banner" alt="">
  </div> -->
  <div class="content" :style="properties.style || ''"
    v-if="properties && typeof properties === 'object' && properties.design && !Array.isArray(properties?.design) && Object.keys(properties?.design).length > 0">
    <img :src="banner" alt="">
    <img :src="banner" alt="">

    <types v-for="[key, property] in Object.entries(properties?.design)" :property="property" :context="null" :key="key"
      :action="action" />

  </div>
</template>

<script setup>
import { onMounted, ref, toRaw } from 'vue'
import axios from 'axios'
import types from '../../../../../src/_dynamic/formDesignPropertiesTypes.vue'
import { useNotification } from 'naive-ui'
import banner from '../assets/brochazo.svg'
const props = defineProps(['socket'])

const properties = ref(null)

const notification = useNotification()

// iteración del objeto para extraer el valor
const action = (action) => {
  const iteration = (obj) => {
    if (!obj) return
    for (const [key, value] of Object.entries(obj)) {
      const val = value.value || value.object || ''
      if (typeof val === 'object') {
        obj[key] = val
        if (!Array.isArray(val)) iteration(val)
      } else {
        obj[key] = val
      }
    }
  }
  const getProperties = () => {
    if (!properties.value.design) return {}
    const obj = structuredClone(toRaw(properties.value.design))
    console.log('getProperties', obj)
    iteration(obj)
    return obj
  }
  const property = getProperties()
  if (props.socket) props.socket.emit('action', { action, properties: property })
}

// iteración del objeto para extraer el valor
const regexInit = /{{[^}]*}}/g
const tempReference = {}

const changeProperty = ({ obj = null, reference, dir = '', value } = {}) => {
  obj = obj || properties.value
  for (const [keyElement, valueElement] of Object.entries(obj)) {
    if (valueElement === null) return
    if (typeof valueElement === 'object') {
      changeProperty({ obj: obj[keyElement], reference, dir: `${dir}.${keyElement}`, value })
    } else {
      const valueReference = tempReference[`${dir}.${keyElement}`] || valueElement
      const coincidencias = valueReference.toString().match(regexInit)
      if (coincidencias) {
        if (!tempReference[`${dir}.${keyElement}`]) tempReference[`${dir}.${keyElement}`] = obj[keyElement]
        coincidencias.forEach(list => {
          console.log('changeProperty', reference, list)
          if (reference.toString().toUpperCase().trim() === list.toString().toUpperCase().trim()) {
            const key = keyElement[0] !== '_' ? keyElement : keyElement.slice(1)
            if (coincidencias.length === 1 && typeof value === 'object') {
              obj[key] = value
            } else {
              obj[key] = valueReference.replace(list, value)
              if (typeof obj[key] === 'string') {
                console.log('changeProperty', obj[key], value)
                if (obj[key].toString().toUpperCase().trim() === 'TRUE') obj[key] = true
                if (obj[key].toString().toUpperCase().trim() === 'FALSE') obj[key] = false
              }
            }
          }
        })
      }
    }
  }
}

onMounted(() => {
  if (props.socket) {
    props.socket.emit('setLocalStorage', { variable: localStorage.getItem('global') })

    props.socket.on('getModel', (value) => {
      properties.value = value
    })
    // Cambiando valores globales

    props.socket.on('changeProperty', (data) => {
      changeProperty({ reference: data.reference, value: data.value })
    })

    props.socket.on('notify', (data) => {
      console.log(data)
      notification[data.type]({
        title: data.title,
        content: data.message,
        duration: 5000
      })
    })

    props.socket.on('redirect', (data) => {
      window.location.href = data.url
    })

    props.socket.on('setValue', (data) => {
      let obj = {}
      let global = {}
      try {
        obj = JSON.parse(data.variable)
        if (data.global) global = JSON.parse(data.global)
      } catch (error) {
        console.log(error)
      }

      Object.entries(obj).forEach(([key, value]) => {
        key = key.replace(/{{/g, '').replace(/}}/g, '')
        changeProperty({ reference: `{{${key}}}`, value })
      })

      if (Object.keys(global).length > 0) {
        const previousGlobal = localStorage.getItem('global')
        if (previousGlobal) {
          const previousGlobalObject = JSON.parse(previousGlobal)
          global = { ...previousGlobalObject, ...global }
        }
        localStorage.setItem('global', JSON.stringify(global))
      }
    })
  }
})

</script>

<style scoped>
.content {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: white;
  height: 100%;
  width: 100%;
  overflow: auto;
  border: 1px solid #4a5568;
  color: #555;
  box-sizing: border-box;
  align-items: flex-start;
  background-image: url(../assets/fondo.png);
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;

}

.content>img {
  height: 150px;
}

.content>img:nth-child(2) {
  position: absolute;
  top: -35px;
  right: -55px;
  height: 250px;
}

.content>img:nth-child(1) {
  position: absolute;
  bottom: -30px;
  left: -50px;
}
</style>
