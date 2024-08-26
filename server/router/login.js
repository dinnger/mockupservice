import express from 'express'
import Ajv from 'ajv'
import axios from 'axios'
import routerGoogle from '../../horizonShare/plugins/authentication/google.js'
import routerLocal from '../../horizonShare/plugins/authentication/local.js'
import routerLdap from '../../horizonShare/plugins/authentication/ldap.js'

const { createRequire } = await import('node:module')
const require = createRequire(import.meta.url)
const pk = require('../../package.json')
const version = pk.version
const ajv = new Ajv()
const router = express.Router()

let appInstance_ = null

async function loadInformation (req) {
  return await appInstance_.security().user().local({ alias: req.body.username })
}

async function loadInformationUser (alias) {
  return await appInstance_.security().user().get({ alias })
}

async function saveNewUser (req) {
  return await appInstance_.security().user().new({ alias: req.body.username })
}

async function getUserNamespace (id) {
  return await appInstance_.security().user().permissions().namespace({ id })
}

async function getUserAccess (id) {
  return await appInstance_.security().user().permissions().access({ id })
}

const clearText = (text) => {
  return text
    .replace(/#/g, '&#35;')
    .replace(/!/g, '&#33;')
    .replace(/"/g, '&#34;')
    .replace(/\$/g, '&#36;')
    .replace(/%/g, '&#37;')
    .replace(/'/g, '&#39;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;')
    .replace(/\//g, '&#47;')
}

async function loadLDAP (req) {
  return new Promise(resolve => {
    const url = 'http://172.22.116.69:8380/authservices/AuthService'
    const body = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:aut="http://authservices.ws.gt.dinnger.com/">
    <soapenv:Header/>
    <soapenv:Body>
        <aut:requestUserInfo>
            <ldapId>100</ldapId>
            <user>${req.body.username}</user>
            <password>${clearText(req.body.password)}</password>
        </aut:requestUserInfo>
    </soapenv:Body>
    </soapenv:Envelope>`
    const config = {
      headers: {
        'Content-Type': 'text/xml'
      }
    }
    axios.post(url, body, config)
      .then((response) => {
      // console.log(response)
        const { XMLParser } = require('fast-xml-parser')
        const parser = new XMLParser()
        const jObj = parser.parse(response.data)
        resolve(jObj['soap:Envelope']['soap:Body']['ns1:requestUserInfoResponse'].userInfo)
      })
      .catch(() => {
        return null
      })
  })
}

function validLogin (req) {
  const schema = {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 3 }
    },
    required: ['username', 'password']
  }
  const valid = ajv.validate(schema, req.body)
  if (!valid) return false
  return true
}

function validToken (req) {
  const schema = {
    type: 'object',
    properties: {
      token: { type: 'string' },
      instancia: { type: 'string', enum: ['desarrollo', 'qa', 'prod'] }
    },
    required: ['token', 'instancia']
  }
  const valid = ajv.validate(schema, req.body)
  if (!valid) return false
  return true
}

function validPassword (valid, origen) {
  const bcrypt = require('bcrypt')
  return bcrypt.compareSync(valid, origen)
}

function generateToken (encript, secret = '=tkp6uJI2@G9') {
  try {
    const jwt = require('jsonwebtoken')
    const hash = jwt.sign(encript, secret, { expiresIn: 12 * 60 * 60 })
    return hash
  } catch {
    return null
  }
}

function getToken (value) {
  try {
    const jwt = require('jsonwebtoken')
    const val = jwt.verify(value, '=tkp6uJI2@G9')
    return val
  } catch {
    return null
  }
}

export function initRouter ({ app, appInstance }) {
  appInstance_ = appInstance

  router.use('/google', routerGoogle({ app, appInstance, generateToken }))
  router.use('/local', routerLocal({ validLogin, validPassword, loadInformation, loadInformationUser, saveNewUser, generateToken }))
  router.use('/ldap', routerLdap({ validLogin, loadLDAP, loadInformationUser, saveNewUser, generateToken }))

  router.post('/validate', async (req, res) => {
    if (!validToken(req)) return res.status(403).json('Datos inválidos')
    const token = await getToken(req.body.token)
    if (!token || !token.alias) return res.status(403).json('Datos inválidos')
    let levelRole = 999
    const userV = await loadInformationUser(token.alias)
    if (!userV) return res.status(403).json('Datos inválidos')
    const permissions = await getUserAccess(token.id)
    if (permissions?.users_roles) {
      permissions.users_roles.forEach(m => {
        if (m.role.levelRole < levelRole) levelRole = m.role.levelRole
      })
    }
    const namespace = await getUserNamespace(token.id)
    // console.log(namespace.users_project.project)
    const permission = [...new Set(permissions?.users_roles.map(m => m.role.permissions).flat())] || []
    const data = {
      id: token.id,
      alias: token.alias,
      levelRole,
      permissions: permission,
      namespaces: namespace?.users_namespace.namespace || [],
      projects: namespace?.users_project.project || []
    }

    res.status(200).json({
      id: token.id,
      alias: token.alias,
      google: userV.google,
      levelRole,
      permissions: permission,
      token: generateToken(data, 'aS$3sPP7TAoapedK'),
      version
    })
  })
  return router
}
