import { db, sequelize, Op } from '../database/connect.js'
import { createRequire } from 'node:module'
import CryptoJS from 'crypto-js'
const require = createRequire(import.meta.url)
const jwt = require('jsonwebtoken')

export default function () {
  return {
    user () {
      return {
        // security/user/local
        async local ({ alias }) {
          const data = await db.SECURITY.USERS_LOCAL.findAll({
            where: {
              alias,
              active: true
            }
          })
          return data
        },
        // security/user/get
        async get ({ alias }) {
          const data = await db.SECURITY.USERS.findOne({
            where: {
              alias
            }
          })
          return data
        },
        // security/user/getAllAlias
        async getAllAlias () {
          const data = await db.SECURITY.USERS.findAll({
            attributes: ['alias'],
            where: {
              active: true
            },
            order: [['alias', 'ASC']]
          })
          return data
        },
        // security/user/all
        async all () {
          const data = await db.SECURITY.USERS.findAll({
            include: [
              {
                model: db.SECURITY.USERS_ROLES,
                required: false
              }, {
                model: db.SECURITY.USERS_NAMESPACES,
                required: false
              },
              {
                model: db.SECURITY.USERS_PROJECTS,
                required: false
              }
            ],
            where: {
              alias: {
                [Op.not]: 'admin'
              }
            },
            order: [
              ['alias', 'ASC']
            ]
          })
          return data
        },
        // security/user/update
        async update ({ id, active, roles, namespace, project }) {
          const t = await sequelize.transaction()
          try {
            await db.SECURITY.USERS.update({ active }, { where: { id }, transaction: t })
            await db.SECURITY.USERS_NAMESPACES.upsert({ namespace, userId: id }, { where: { userId: id }, transaction: t })
            await db.SECURITY.USERS_PROJECTS.upsert({ project, userId: id }, { where: { userId: id }, transaction: t })
            await db.SECURITY.USERS_ROLES.upsert({ rolId: roles, userId: id }, { where: { userId: id }, transaction: t })
            await t.commit()
          } catch (error) {
            await t.rollback()
          }
          return id
        },
        // security/user/avatar
        async avatar ({ session, avatar }) {
          const t = await sequelize.transaction()
          try {
            await db.SECURITY.USERS.update({ avatar: JSON.stringify(avatar) }, { where: { id: session.id }, transaction: t })
            await t.commit()
          } catch (error) {
            await t.rollback()
          }
          return { status: true }
        },
        // security/user/new
        async new ({ alias, google = null } = {}) {
          try {
            let data = await db.SECURITY.USERS.findOne({ where: { alias } })
            if (!data) data = await db.SECURITY.USERS.create({ alias, google })
            return data
          } catch (error) {
            return { error: error.toString() }
          }
        },
        // security/user/newLocal
        /**
        alias: tempUser.value.alias,
        password: tempUser.value.password,
        firstName: tempUser.value.firstName,
        lastName: tempUser.value.lastName,
        active: props.user.active,
        roles: props.user.users_roles
         */
        async newLocal ({ alias, firstName, lastName, password, roles, active }) {
          const transaction = await sequelize.transaction()

          try {
            const bcrypt = require('bcrypt')
            const saltRounds = 10

            const existLocal = await db.SECURITY.USERS_LOCAL.findOne({ where: { alias: { [Op.iLike]: alias } } })
            const exist = await db.SECURITY.USERS.findOne({ where: { alias: { [Op.iLike]: alias } } })
            if (!existLocal && !exist) {
              await db.SECURITY.USERS_LOCAL.create({ alias, firstName, lastName, password: bcrypt.hashSync(password, saltRounds), active }, { transaction })
              const user = await db.SECURITY.USERS.create({ alias, active }, { transaction })
              await db.SECURITY.USERS_ROLES.create({ userId: user.id, rolId: roles }, { transaction })
              await transaction.commit()
              return { status: true }
            } else {
              return { error: 'El usuario ya existe' }
            }
          } catch (error) {
            await transaction.rollback()
            return { error: error.toString() }
          }
        },
        permissions () {
          return {
            async namespace ({ id }) {
              const data = await db.SECURITY.USERS.findOne({
                include: [
                  {
                    attributes: ['namespace'],
                    model: db.SECURITY.USERS_NAMESPACES,
                    required: true
                  },
                  {
                    attributes: ['project'],
                    model: db.SECURITY.USERS_PROJECTS,
                    required: true
                  }
                ],
                where: {
                  id,
                  active: true
                }
              })
              return data
            },
            async access ({ id }) {
              const data = await db.SECURITY.USERS.findOne({
                include: [
                  {
                    model: db.SECURITY.USERS_ROLES,
                    required: true,
                    include: [
                      {
                        attributes: ['levelRole', 'permissions'],
                        model: db.SECURITY.ROLES,
                        required: true
                      }
                    ]
                  }
                ],
                where: {
                  id,
                  active: true
                }
              })
              return data
            }
          }
        }
      }
    },
    roles () {
      return {
        async all () {
          const data = await db.SECURITY.ROLES.findAll({ order: [['name', 'ASC']] })
          return data
        },
        async update ({ id, permissions }) {
          return db.SECURITY.ROLES.upsert({ id, permissions }, { where: { id } })
        }
      }
    },
    secret () {
      return {
        async get ({ tag, token }) {
          const data = await db.SECURITY.SECRET.findAll({
            attributes: ['data'],
            where: {
              tag,
              token,
              instance: process.env.GLOBAL_INSTANCE,
              activo: true
            }
          })
          return data
        },
        async getAll () {
          const data = await db.SECURITY.SECRET.findAll({
            attributes: ['instance', 'node', 'tag', 'data', 'token', 'activo'],
            order: [
              ['instance', 'ASC'],
              ['node', 'ASC'],
              ['tag', 'ASC']
            ],
            raw: true
          })

          const list = data.reduce((acc, m) => {
            let data_ = (!m.data) ? '' : CryptoJS.AES.decrypt(m.data, '3Wf]P~P<46Vm').toString(CryptoJS.enc.Utf8)
            data_ = data_ ? JSON.parse(data_) : {}
            const node = acc.find(f => f.node === m.node)

            if (!node) {
              acc.push({
                node: m.node,
                list: [{
                  tag: m.tag,
                  list: [{ ...m, data: data_ }]
                }]
              })
            } else {
              const tag = node.list.find(f => f.tag === m.tag)

              if (!tag) {
                node.list.push({
                  tag: m.tag,
                  list: [{ ...m, data: data_ }]
                })
              } else {
                tag.list.push({ ...m, data: data_ })
              }
            }

            return acc
          }, [])

          return list
        },
        async getNode ({ node }) {
          return db.SECURITY.SECRET.findAll({
            attributes: ['tag', 'token', 'activo'],
            where: {
              node,
              instance: process.env.GLOBAL_INSTANCE
              // activo: true
            }
          })
        },
        async new ({ tag, node, instance, data }) {
          const data_ = CryptoJS.AES.encrypt(data, '3Wf]P~P<46Vm').toString()
          return db.SECURITY.SECRET.create({
            tag,
            node,
            instance,
            activo: true,
            data: data_,
            token: Math.floor(Math.random() * 9000) + 1000
          })
        },
        async update ({ tag, node, instance, data, active }) {
          const data_ = CryptoJS.AES.encrypt(data, '3Wf]P~P<46Vm').toString()
          return db.SECURITY.SECRET.update({
            activo: active,
            data: data_
          }, {
            where: {
              tag,
              node,
              instance
            }
          })
        }
      }
    },
    session: ({ socket, token }) => {
      return {
        set: ({ socket, token }) => {
          const secret = 'aS$3sPP7TAoapedK'
          try {
            socket.session = jwt.verify(token, secret)
          } catch (error) {
            socket.session = null
            return error
          }
          return 'ok'
        },
        get: ({ socket }) => {
          return socket.session
        }
      }
    }
  }
}
