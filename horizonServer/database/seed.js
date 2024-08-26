import { createRequire } from 'node:module'
import { sequelize } from './connect.js'
const require = createRequire(import.meta.url)

export const initSeed = async (db) => {
  const transaction = await sequelize.transaction()
  const bcrypt = require('bcrypt')
  const saltRounds = 10
  // Generar contraseña aleatoria
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const passwordLength = 12
  let password = ''
  for (let i = 0; i <= passwordLength; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length)
    password += chars.substring(randomNumber, randomNumber + 1)
  }
  const hash = bcrypt.hashSync(password, saltRounds)

  try {
    await db.SECURITY.USERS_LOCAL.create({
      alias: 'admin',
      firstName: 'admin',
      active: true,
      password: hash
    }, {
      transaction
    })

    const exist = await db.SECURITY.USERS.findOne({ where: { alias: 'admin' } })
    if (!exist) {
      const user = await db.SECURITY.USERS.create({
        alias: 'admin',
        active: true
      }, {
        transaction
      })
      const roles = await db.SECURITY.ROLES.create({
        id: 'admin',
        name: 'admin',
        levelRole: 1,
        permissions: [
          'inicio',
          'namespace_crear',
          'namespace_editar',
          'flujo',
          'flujo_crear',
          'flujo_editar',
          'flujo_eliminar',
          'flujo_ver',
          'flujo_core',
          'nodos',
          'nodos_crear',
          'nodos_editar',
          'nodos_eliminar',
          'nodos_ver',
          'configuracion',
          'configuracion_usuarios',
          'configuracion_usuarios_nuevo',
          'configuracion_usuarios_asignar_igualitario',
          'configuracion_roles',
          'configuracion_variable_global_crear',
          'configuracion_variable_global_editar',
          'configuracion_variable_global_eliminar',
          'configuracion_variable_global_ver',
          'configuracion_credencial_crear',
          'configuracion_credencial_editar',
          'configuracion_credencial_eliminar',
          'configuracion_credencial_ver'
        ]
      }, {
        transaction
      })
      await db.SECURITY.USERS_ROLES.create({
        userId: user.id,
        rolId: roles.id
      }, {
        transaction
      })
      await db.SECURITY.USERS_NAMESPACES.create({
        userId: user.id,
        namespace: ['*']
      }, {
        transaction
      })
      await db.SECURITY.USERS_PROJECTS.create({
        userId: user.id,
        project: ['*']
      }, {
        transaction
      })
    }
    transaction.commit()
    console.log('=========================================================')
    console.log('password', password)
    console.log('=========================================================')
  } catch (error) {
    console.log('error', error)
    transaction.rollback()
  }
}
