import fs from 'fs'
import 'dotenv/config'
import { v4 as uuid, v5 as uuidv5 } from 'uuid'
import { createRequire } from 'node:module'

const namespaceV5 = '1b671a64-40d5-491e-99b0-da01ff1f3341'

/**
  * Obtener información de un flujo.
  * @returns {Object} - Flujo.
  * @property {Function} get - Obtener flujo.
  */
export class WorkerModel {
  constructor () {
    this.id = null
    this.idWorkDir = null
  }

  get ({ flow }) {
    const id = flow.replace(/\\/g, '/').split('/').pop().split('.').shift()
    const modelName = flow.split('.').pop()
    try {
      const dir = `${flow}/${modelName}.flow`
      const data = fs.readFileSync(dir, 'utf-8')
      const model = JSON.parse(data)
      model.properties.id = id
      const environment = {
        base_url: process.env.BASE_URL,
        path_url: process.env.PATH_URL,
        node_env: process.env.NODE_ENV
      }
      this.idWorkDir = uuidv5(id, namespaceV5)
      return { model, environment }
    } catch (error) {
      console.log(error)
      return {}
    }
  }

  workDir () {
    const require = createRequire(import.meta.url)
    return {
      // Crea archivos temporal, cuando finaliza devuelve el buffer y lo elimina
      // Workerfile/workDir/temporal
      temporal: (fn) => {
        const id = uuid()
        const workDirPath = (process.env.EXECUTIONS_WORKDIR || './workdir') + `/${this.idWorkDir}`
        if (!fs.existsSync(workDirPath)) fs.mkdirSync(workDirPath, { recursive: true })
        const f = fs.createWriteStream(workDirPath + `/${id}.tmp`)
        f.on('finish', async () => {
          // do stuff
          if (fn && typeof fn === 'function') {
            const data = await this.workDir().get({ fileName: `${id}.tmp` })
            fn(data)
            this.workDir().remove({ fileName: `${id}.tmp` })
          }
        })
        return f
      },
      // Workerfile/workDir/get
      list () {
        const workDirPath = (process.env.EXECUTIONS_WORKDIR || './workdir') + `/${this.idWorkDir}`
        if (!fs.existsSync(workDirPath)) return []
        const listFilesSync = (dir) => {
          let fileList = []
          fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
            const fullPath = file.path + '/' + file.name
            // use lstat so this does not follow dir symlinks
            // (otherwise this will include files from other dirs, which I don't want)
            if (fs.lstatSync(fullPath).isDirectory()) {
              fileList = fileList.concat(listFilesSync(fullPath))
            } else {
              fileList.push({ fullPath, name: file.name, path: file.path, size: fs.statSync(fullPath).size })
            }
          })
          return fileList
        }

        const list = listFilesSync(workDirPath)
        return new Promise((resolve, reject) => {
          // Evitando que el archivo viaje al root
          if (fs.existsSync(workDirPath)) {
            resolve(list)
          } else {
            resolve([])
          }
        })
      },
      // Workerfile/workDir/get
      get ({ path, fileName, options = { encode: 'utf8' } }) {
        const workDirPath = (process.env.EXECUTIONS_WORKDIR || './workdir') + `/${this.idWorkDir}`
        return new Promise((resolve, reject) => {
          // Evitando que el archivo viaje al root
          path = path ? path.replace(/\./g, '') : ''
          const dir = `${workDirPath}/${path}/${fileName}`
          if (fs.existsSync(dir) && fs.lstatSync(dir).isFile()) {
            resolve(fs.readFileSync(dir, options.encode))
          } else {
            reject(new Error('No se ha encontrado la ruta'))
          }
        })
      },
      // Workerfile/workDir/create
      async create ({ path, fileName, file, options }) {
        const workDirPath = (process.env.EXECUTIONS_WORKDIR || './workdir') + `/${this.idWorkDir}`
        const extract = require('extract-zip')
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          try {
            // Evitando que el archivo viaje al root
            if (path) path = path.replace(/\./g, '')
            // Creando carpeta
            const dir = `${workDirPath}/${path || ''}`
            const dirFile = `${dir}/${fileName}`

            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, force: true })
            if (options.rewrite) fs.rmSync(dirFile, { recursive: true, force: true })
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
                resolve({ dirFile })
              }
            } else {
              reject(new Error('El archivo ya existe'))
            }
          } catch (error) {
            reject(error)
          }
        })
      },
      // Workerfile/workDir/remove
      remove ({ path = null, fileName = '', options = { recursive: true, force: true } } = {}) {
        const workDirPath = (process.env.EXECUTIONS_WORKDIR || './workdir') + `/${this.idWorkDir}`
        return new Promise((resolve, reject) => {
          try {
            const dir = path ? `${workDirPath}/${path}` : `${workDirPath}`
            const dirFile = `${dir}/${fileName}`
            console.log('dir', dirFile)
            fs.rmSync(dirFile, options)
            resolve(true)
          } catch (error) {
            reject(error)
          }
        })
      }
    }
  }
}
