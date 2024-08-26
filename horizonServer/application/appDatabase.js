import { db } from '../database/connect.js'
import fs from 'fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const schema = () => {
  return {
    /**
     * list
     * @param {*} param0
     * @returns
     */
    // database/list
    async list ({ session } = {}) {
      // Buscar todos los archivos en _database/{session.id}
      const listDatabase = await db.DATABASES.SCHEMA.findAll({
        attributes: ['id', 'name', 'path', 'active', 'createdUser'],
        where: {
          active: true,
          createdUser: session.id
        },
        order: [
          ['id', 'desc']
        ]
      })
      return listDatabase
    },

    /**
     * new
     * @param {*} param0
     * @returns
     */
    // database/new
    async new ({ name, session }) {
      // Creando carpeta
      const dir = `./_database/${session.alias}`
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const sqlite3 = require('sqlite3').verbose()
      try {
        const exist = await db.DATABASES.SCHEMA.findOne({ where: { name, createdUser: session.id, active: true } })
        if (exist) return { error: 'La base de datos ya existe' }
        // Creando schema
        const database = new sqlite3.Database(`${dir}/${name}.db`)
        if (!database) return { error: 'No se pudo crear la base de datos' }
        const data = await db.DATABASES.SCHEMA.create({ name, path: `${dir}/${name}.db`, active: true, createdUser: session.id, createdAt: new Date() })
        return data
      } catch (error) {
        return { error: error.toString() }
      }
    },

    /**
     * connect
     * @param {*} param0
     * @returns
     */
    // database/connect
    async connect ({ id }) {
      const schema = await db.DATABASES.SCHEMA.findOne({ where: { id, active: true } })
      if (!schema) return null
      const path = schema.path
      if (!fs.existsSync(path)) return null
      const sqlite3 = require('sqlite3').verbose()
      const database = new sqlite3.Database(path)
      return database
    },

    /**
    * exec
    * @param {*} param0
    * @returns
    */
    // database/exec
    async exec ({ database, query, session }) {
      try {
        const db = await this.connect({ id: database, session })
        if (!db) return { error: 'No se pudo conectar' }
        return new Promise((resolve, reject) => {
          // Si es crear tabla o eliminar tabla
          if (query.toLowerCase().match(/^\s*(create|drop)\s+table\s+/i)) {
            return resolve({ error: 'No se puede ejecutar consultas de creación o eliminación de tablas' })
          }
          if (query.toLowerCase().match(/^\s*select\s+/i)) {
            db.all(query, (err, result) => {
              if (err) return resolve({ error: err.toString() })
              return resolve(result)
            })
          } else {
            db.run(query, (err, result) => {
              console.log(err, result)
              if (err) return resolve({ error: err.toString() })
              return resolve(result)
            })
          }
        })

        // return result.run()
      } catch (error) {
        return { error }
      }
    },

    // database/delete
    async delete ({ id }) {
      const schema = await db.DATABASES.SCHEMA.findOne({ where: { id, active: true } })
      if (!schema) return { error: 'No se pudo encontrar la base de datos' }
      const path = schema.path
      try {
        if (fs.existsSync(path)) fs.rmSync(path, { recursive: true })
        await db.DATABASES.SCHEMA.update({ active: false }, { where: { id } })
        return await db.DATABASES.TABLE.update({ active: false }, { where: { idSchema: id } })
      } catch (error) {
        return { error: error.toString() }
      }
    }
  }
}

const table = () => {
  return {
    // table/new
    async new ({ idSchema, table, fields, session }) {
      const database = await schema().connect({ id: idSchema, session })
      if (!database) return { error: 'No se pudo conectar' }
      const query = `CREATE TABLE ${table} (${fields.map(f => `${f.name} ${f.type === 'autoIncrement' ? 'integer' : f.type} ${f.primaryKey ? 'PRIMARY KEY' : ''}  ${f.required ? 'NOT NULL' : ''} ${f.type === 'autoIncrement' ? 'AUTOINCREMENT' : ''}`).join(',')})`
      console.log(query)
      return new Promise(resolve => {
        database.run(query, async (err, result) => {
          if (err) return resolve({ error: err.toString() })
          await db.DATABASES.TABLE.create({ idSchema, name: table, fields, createdUser: session.id })
          return resolve([{ result: 'ok' }])
        })
      })
    },
    // table/list
    async list ({ databaseId, session }) {
      return await db.DATABASES.TABLE.findAll({ where: { idSchema: databaseId, active: true } })
    },
    // table/delete
    async delete ({ id, session }) {
      const table = await db.DATABASES.TABLE.findOne({ where: { id, active: true } })
      if (!table) return { error: 'No se pudo encontrar la tabla' }
      try {
        const database = await schema().connect({ id: table.idSchema, session })
        if (!database) return { error: 'No se pudo conectar' }
        const query = `DROP TABLE ${table.name}`
        return new Promise(resolve => {
          database.run(query, async (err, result) => {
            await db.DATABASES.TABLE.update({ active: false }, { where: { id } })
            if (err) return resolve({ error: err.toString() })
            return resolve([{ result: 'ok' }])
          })
        })
      } catch (error) {
        return { error: error.toString() }
      }
    }
  }
}

export default function ({ el } = {}) {
  return {
    // database/schema
    schema,
    // database/table
    table
  }
}
