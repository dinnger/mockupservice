/**
 * Archivo Prometeo.js
 *
 * Este archivo se encarga de proporcionar todas las configuraciones iniciales
 * y recursos esenciales necesarios para que el proyecto comience con éxito.
 * Así como Prometeo entregó el fuego a los humanos, este archivo transfiere
 * el conocimiento y el poder necesarios para el funcionamiento de la aplicación.
 *
 * Contenido:
 * - Configuración de parámetros globales.
 * - Inicialización de módulos y bibliotecas necesarios.
 * - Carga de datos iniciales.
 * - Gestión de autenticación y autorización.
 * - Definición de rutas y navegación.
 * - Manejo de eventos y notificaciones globales.
 *
 * Este archivo debe cargarse antes que cualquier otro archivo JavaScript
 * en la aplicación para garantizar que todas las configuraciones iniciales
 * estén en su lugar antes de que comience la ejecución de otros módulos.
 *
 * Autor: Walter
 * Fecha de creación: 26/09/2023
 */

import fs from 'fs'

import 'dotenv/config'
import { createRequire } from 'node:module'

// global
const listFlows = []
let database = null
if (process.env.NODE_ENV === 'development') {
  const { db } = await import('../horizonServer/database/connect.js')
  database = db
} else {
  const { db } = await import('./database_core/connect.js')
  database = db
}

class Prometeo {
  constructor () {
    this.db = null
  }

  pathDir () {
    return {
      new: ({ path, recursive }) => {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive })
      }
    }
  }

  get () {
    // Obtiene el listado de flujos
    const flows = () => {
      const path = './_flows/'
      const flows = fs.readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
      const data = flows.map(flowPath => {
        const arr = flowPath.split('.')
        const name = arr.pop()
        const namespace = arr.join('.')
        return {
          namespace: {
            name: namespace
          },
          name
        }
      })
      return data
    }
    // Obtener datos del archivo
    const readFile = ({ path, codec = 'utf8' }) => {
      if (fs.existsSync(path)) {
        const { size, birthtime } = fs.statSync(path)
        const name = path.split('/').pop()
        return {
          name,
          path: path.replace(name, ''),
          size,
          birthtime,
          data: codec
            ? fs.readFileSync(path, {
              encoding: 'utf8'
            })
            : fs.readFileSync(path)
        }
      }
    }
    // Obtener el listado de archivos en una carpeta
    const filesByPath = ({ path, parent = [], recursive = false }) => {
      const list = []
      const files = fs.readdirSync(path, { withFileTypes: true }).map(m => { return { ...m, isDirectory: m.isDirectory(), parent, path } })
      files.forEach(file => {
        if (file.isDirectory && recursive) {
          list.push(file)
          list.push(...filesByPath({ path: `${path}/${file.name}`, parent: [...parent, file.name], recursive }))
        } else {
          list.push(file)
        }
      })
      return list
    }
    const fileStream = ({ path }) => {
      return fs.createReadStream(path)
    }
    // Listado de gits
    const gits = () => {
      return fs.readdirSync('./flowsDeploy/', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name[0] !== '_')
        .map(dirent => dirent.name)
    }

    return {
      flows,
      readFile,
      filesByPath,
      fileStream,
      gits
    }
  }

  copy ({ sourcePath, targetPath, recursive = false, move = false }) {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!fs.existsSync(sourcePath)) return 'sourcePath no existe'

      if (move) return fs.renameSync(sourcePath, targetPath)
      const stats = fs.statSync(sourcePath)
      if (stats.isFile()) {
        fs.copyFileSync(sourcePath, targetPath)
      } else {
        fs.cpSync(sourcePath, targetPath, { recursive })
      }
      return true
    } catch (error) {
      throw error
    }
  }

  remove ({ path, recursive = false, force = false }) {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!fs.existsSync(path)) return true
      const stats = fs.statSync(path)
      if (stats.isFile()) {
        fs.rmSync(path)
      } else {
        fs.rmSync(path, { recursive, force })
      }
      return true
    } catch (error) {
      throw error
    }
  }

  set () {
    const file = ({ path, data, format = 'utf8' } = {}) => {
      return fs.writeFileSync(path, data, format)
    }
    const fileStream = ({ path, format = 'utf8' } = {}) => {
      return fs.createWriteStream(path, format)
    }
    const newPath = ({ path, recursive }) => {
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive })
    }
    return {
      newPath,
      file,
      fileStream
    }
  }

  async documentation ({ namespace, flow, type, data }) {
    const require = createRequire(import.meta.url)

    return new Promise(resolve => {
      // useCase
      if (type === 'useCase') {
        if (!fs.existsSync(`./_flows/${namespace}/${flow}/_doc`)) fs.mkdirSync(`./_flows/${namespace}/${flow}/_doc`)
        fs.writeFileSync(`./_flows/${namespace}/${flow}/_doc/useCase.json`, JSON.stringify(data))
        resolve(true)

        // getUseCase
      } else if (type === 'getUseCase') {
        if (fs.existsSync(`./_flows/${namespace}/${flow}/_doc/useCase.json`)) resolve(fs.readFileSync(`./_flows/${namespace}/${flow}/_doc/useCase.json`, 'utf-8'))
        resolve(null)

        // evalUseCase
      } else if (type === 'evalUseCase') {
        const { spawn } = require('child_process')
        const test = spawn('npx', ['vitest', `./_flows/${namespace}/${flow}`, '--run', '--reporter=json'])
        test.stdout.on('data', (chunk) => {
          resolve(chunk.toString())
        })

        // getTest
      } else if (type === 'getTest') {
        if (fs.existsSync(`./_flows/${namespace}/${flow}/_doc`)) resolve(fs.readFileSync(`./_flows/${namespace}/${flow}/_doc/index.test.js`, 'utf-8'))
        resolve(null)
      } else {
        resolve(true)
      }
    })
  }

  // loadNodesDoc ({ name }) {
  //   const path = `./horizon/doc/${name}.md`
  //   if (fs.existsSync(path)) {
  //     const data = fs.readFileSync(path, 'utf-8')
  //     return data
  //   }
  //   return ''
  // }

  workDirFlow ({ flow }) {
    const require = createRequire(import.meta.url)
    const workdir = `./_flows/${flow}/_workdir`
    const get = ({ path, fileName, options = { encode: 'utf8' } }) => {
      return new Promise((resolve, reject) => {
        // Evitando que el archivo viaje al root
        path = path.replace(/\./g, '')
        const dir = `${workdir}/${path}/${fileName}`
        if (fs.existsSync(dir) && fs.lstatSync(dir).isFile()) {
          resolve(fs.readFileSync(dir, options.encode))
        } else {
          reject(new Error('No se ha encontrado la ruta'))
        }
      })
    }
    const create = async ({ path, fileName, file, options }) => {
      const extract = require('extract-zip')
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        try {
          // Evitando que el archivo viaje al root
          path = path.replace(/\./g, '')
          // Creando carpeta
          const dir = `${workdir}/${path}`
          const dirFile = `${dir}/${fileName}`

          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, force: true })
          if (!fs.existsSync(dirFile)) {
            // Descomprimir
            if (options?.unzip) {
              fs.writeFileSync(dirFile, file)
              const path = require('path')
              const absolutePath = path.resolve(`${dir}/_${fileName}`)
              await extract(dirFile, { dir: absolutePath })
              fs.rmSync(dirFile)
              fs.renameSync(`${dir}/_${fileName}`, dirFile)
              resolve(fs.readdirSync(dirFile, { withFileTypes: true }))
            } else {
              fs.writeFileSync(dirFile, file)
              resolve(true)
            }
          } else {
            reject(new Error('El directorio ya se encuentra en uso'))
          }
        } catch (error) {
          reject(error)
        }
      })
    }
    const remove = ({ path, fileName, options = { recursive: true, force: true } }) => {
      return new Promise((resolve, reject) => {
        try {
          const dir = `${workdir}/${path}`
          const dirFile = `${dir}/${fileName}`
          if (!fs.existsSync(dirFile)) resolve(true)
          fs.rmSync(dirFile, options)
          resolve(true)
        } catch (error) {
          reject(error)
        }
      })
    }
    return { get, create, remove }
  }

  environment ({ name, variables }) {
    let data = ''
    if (!variables) return
    Object.entries(variables).forEach(([key, value]) => {
      data += `${key}="${encodeURI(value)}"\n`
    })
    fs.writeFileSync(`./environment/${name}.env`, data)
  }

  flow () {
    return {
      get () {
        return listFlows
      },
      variables () {
        return {
          get ({ name }) {
            // console.log(this.context.properties)
            const path = `./environment/${name}.env`
            if (fs.existsSync(path)) {
              const data = fs.readFileSync(`${path}`, 'utf-8').split('\n')
              const variables = {}
              data.forEach(v => {
                const index = v.indexOf('=')
                const key = v.substring(0, index)
                const value = v.substring(index + 1).replace(/"/g, '')
                // console.log(key, value)
                if (key && key !== '') variables[key] = decodeURI(value)
              })
              return variables
            }
            return {}
          }
        }
      }
    }
  }

  security () {
    return {
      secret () {
        return {
          async get ({ tag, token }) {
            const data = await database.SECURITY.SECRET.findAll({
              attributes: ['data'],
              where: {
                tag,
                token,
                instance: process.env.GLOBAL_INSTANCE,
                activo: true
              }
            })
            return data
          }
        }
      }
    }
  }
}

export { Prometeo }
