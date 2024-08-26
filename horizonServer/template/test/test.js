// import supertest from 'supertest'
import server from '../../../server/appTest.js'
import { expect, describe, it } from 'vitest'
const { createRequire } = await import('node:module')
const require = createRequire(import.meta.url)
const data = require('./data.json')

process.env.NODE_ENV = 'development'

const app = await server({ type: 'flow', file: '_flows/{{flow}}', port: `${4000 + {{port}}}` })

const getDataResult = (useCase) => {
  const exist = data.find(d => d.id === useCase)
  if (!exist) return undefined
  const test = exist.test.find(f => f.option === 'result')
  if (!test) return undefined
  return test.data
}

const convertJson = (data) => {
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (e) {
    return data
  }
}

describe('{{flow}}', () => {
// {{tests}}
})
