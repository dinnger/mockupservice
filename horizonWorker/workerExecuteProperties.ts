import { backPropagationCreate } from './workerExecuteBackPropagation.js'

const omitChangeProperty = ['/form']

function initProperties ({ properties, node, input, context, isBackPropagation = false }: { properties: any, node: any, input: any, context: any, isBackPropagation?: boolean }) {
  const regexInit = /{{[^}]*}}/g
  const textProperties = JSON.parse(JSON.stringify(properties))

  const replaceProperty = (regCoincidencia, object = null) => {
    const reg = regCoincidencia.slice(2, -2).match(/([^."']+|"[^"]*"|'[^']*')+|\.\./g)
    if (reg && reg.length > 0) {
      let currentObject = null
      if (object) {
        currentObject = object
      } else if (reg[0].toString().toUpperCase() === 'VAR') { // SI ES VARIABLE
        currentObject = context.properties.value.variables
        if (context.properties.value.localStorage) {
          currentObject = {
            ...currentObject,
            ...context.properties.value.localStorage
          }
        }
      } else if (reg[0].toString().toUpperCase() === 'GLOBAL') { // SI ES VARIABLE GLOBAL (.ENV)
        currentObject = process.env
        if (reg.length > 1) reg[1] = `GLOBAL_${reg[1]}`
      } else if (reg[0].toString().toUpperCase() === 'INPUT') { // SI ES VALOR DEL NODO PREDECESOR
        currentObject = input
      } else { // SI ES NODO
        currentObject = context.getNodeByName(reg[0])
        // Creando referencia para el back forward
        if (!currentObject && !isBackPropagation) backPropagationCreate({ nodeName: reg[0], nodeId: node.id, reference: regCoincidencia, context })
      }
      if (!currentObject) return ''
      let valideData = true

      for (let index = reg.length === 1 ? 0 : 1; index < reg.length; index++) {
        /**
         * Validando si existe doble punto (..)
         * obj: Debido a que es doble punto crea un espacio vació con el split
         */
        const obj = reg[index] !== '..' ? reg[index] : 'data'
        const dobleDot = index === 2 && reg[1] === '..'
        if (dobleDot) {
          const resp = searchAllObject(currentObject, obj)
          valideData = resp !== undefined
          currentObject = resp
        }

        // Si es array
        const isArray = obj.includes('[')
        if (isArray) {
          // Handle array indexing

          const arr = obj.match(/\[(.*?)\]/g)
          const objArr = obj.split('[')[0]
          for (let i = 0; i < arr.length; i++) {
            const arrayIndex = arr[i].replace('[', '').replace(']', '')
            // console.log(objArr, arrayIndex)

            if (isNaN(arrayIndex)) {
              valideData = false
              break
            }

            if (i === 0 && (!currentObject[objArr] || !Array.isArray(currentObject[objArr]) || currentObject[objArr].length <= arrayIndex)) {
              valideData = false
              break
            }
            if (i > 0 && (!currentObject[arrayIndex])) {
              valideData = false
              break
            }
            if (i === 0) currentObject = currentObject[objArr][arrayIndex]
            if (i > 0) currentObject = currentObject[arrayIndex]
          }
        }

        // Si no es doble punto
        if (!dobleDot && !isArray) {
          // Buscando objeto
          // Si no encuentra el objeto
          try {
            // eslint-disable-next-line no-prototype-builtins
            currentObject.hasOwnProperty(obj)
          } catch (error) {
            currentObject = Object.assign({}, currentObject)
          }

          // eslint-disable-next-line no-prototype-builtins
          if (!currentObject.hasOwnProperty(obj)) {
            if (obj === 'length') {
              if (typeof currentObject === 'object' && !Array.isArray(currentObject)) {
                currentObject = Object.keys(currentObject).length
              } else {
                currentObject = currentObject.length
              }
              valideData = true
              break
            }
            // Si es función
            if (obj.indexOf('(') >= 0) {
              try {
                // eslint-disable-next-line no-eval
                eval(`currentObject = currentObject.${obj}`)
                valideData = true
                break
              } catch (error) {
                console.log(error.toString())
              }
            }
            valideData = false
            break
          }
          currentObject = currentObject[obj]
        }
      }
      if (valideData) {
        // if (reg[0].toString().toUpperCase() === 'VAR') return decodeURI(currentObject)
        return currentObject
      } else {
        return ''
      }
    } else {
      return ''
    }
  }

  const searchAllObject = (objeto, claveABuscar) => {
    let resultado

    for (const key in objeto) {
      if (key === claveABuscar) {
        return objeto[key] // Si encontramos la clave, retornamos su valor
      }

      if (typeof objeto[key] === 'object') {
        resultado = searchAllObject(objeto[key], claveABuscar) // Llamada recursiva si el valor es otro objeto
        if (resultado !== undefined) {
          return resultado // Si encontramos el valor en la llamada recursiva, lo retornamos
        }
      }
    }
  }

  const convertEach = (value) => {
    if (value && typeof value === 'string') {
      const regex = /<<([^<>]*\bof\b[^<>]*)>>([\s\S]*?)<<>>/g
      const coincidencias = [...value.matchAll(regex)]
      if (coincidencias && coincidencias.length > 0) {
        coincidencias.forEach(trans => {
          const transform = trans[0]

          const indices = transform.match(/<<([^<>]+)>>/g)[0].slice(2, -2)
          const content = transform.match(/>>(.*?)<<>>/gs)[0].slice(2, -4)
          const [variable, arr] = indices.replace(' of ', '????').split('????')
          const regex = /<<[^>]*>>/g
          if (!arr) value = value.replace(transform, '')
          if (arr) {
            // console.log(variable, arr)
            let text = ''
            for (const item of JSON.parse(arr)) {
              const obj = {}
              obj[variable] = item
              content.match(regex).forEach(remplazo => {
                text += content.replace(remplazo, replaceProperty(remplazo, obj))
              })
            }
            value = value.replace(transform, text)
          }
        })
      }
    }
    return value
  }

  const analizar = (property) => {
    const omitChange = !!node.type && !!omitChangeProperty.find(item => node.type.toLowerCase().slice(-item.length) === item)

    Object.entries(property).forEach(([key, item]) => {
      if (typeof item.value === 'object') {
        if (Array.isArray(item.value)) {
          item.value.forEach(properties => {
            analizar(properties)
          })
        } else {
          if (item.value) {
            Object.entries(item.value).forEach((item) => {
              analizar(item)
            })
          }
        }
      } else {
        const coincidencias = item.value ? item.value.toString().match(regexInit) : null
        if (coincidencias) {
          coincidencias.forEach(list => {
            const valor = replaceProperty(list)
            if (item.value.replace(/\s/g, '') === list.replace(/\s/g, '')) {
              if (!omitChange) item.value = valor
            } else {
              const index = item.value.indexOf(list)
              const isString = /"|'/.test((index > 0) ? item.value[index - 1] : '')
              /**
               * Respuesta Value
               * Si es un objeto el valor obtenido y si se solicita como un string (isString cuando lleva comillas "{{input...}}") se tratara como un texto de lo contrario como un objeto
               * Si es un string se devolverá agregando \" para que sea entendido para el JSON.parse
               */
              let value =
                (typeof valor === 'object')
                  ? (isString)
                      ? JSON.stringify(valor).replace(/"/g, '\\"')
                      : JSON.stringify(valor)
                  : typeof valor === 'undefined' ? '' : valor.toString()
              // Corrección de $ que automáticamente se borra un segundo $ si se agregaba
              value = value.replace(/\$/g, '$$$$')
              if (node.type.toLowerCase().indexOf('database') >= 0) {
                // value = value.replace(/'/g, "''").replace(/"/g, '\\"')
              }
              if (!omitChange) item.value = item.value.replace(list, value)
            }
          })

          if (!omitChange) item.value = convertEach(item.value)
        }
      }
    })
  }

  // Remplazando valores en ciclos

  analizar(textProperties)
  return textProperties
}

export { initProperties }
