import fs from 'fs'
import { db, Op } from '../database/connect.js'

export default function () {
  return {
    async all () {
      const data = await db.FLOWS.FLOW.findAll({
        attributes: ['id', 'name'],
        include: [
          {
            attributes: ['name'],
            model: db.FLOWS.FLOW_NAMESPACES,
            required: true
          }, {
            attributes: ['id', 'useCase', 'test'],
            model: db.FLOWS.FLOW_DOC,
            required: true
          }
        ],
        where: {
          active: true
        },
        order: [['id', 'ASC'], [db.FLOWS.FLOW_DOC, 'id', 'ASC']]
      })
      return data
    },
    // flow/documentation/useCase
    async useCase ({ id, namespace, flow, useCase, session }) {
      const dir = `_flows/${id}.${namespace}.${flow}`
      if (!fs.existsSync(`${dir}/_doc`)) fs.mkdirSync(`${dir}/_doc`, { recursive: true })
      try {
        await db.FLOWS.FLOW_DOC.create({
          idFlow: id,
          useCase,
          active: true,
          createdUser: session.id
        })
        const data = await db.FLOWS.FLOW_DOC.findAll({ attributes: ['id', 'useCase'], where: { idFlow: id } })
        fs.writeFileSync(`${dir}/_doc/useCase.json`, JSON.stringify(data))
        return true
      } catch (error) {
        return { error: error.toString() }
      }
    },
    getUseCase ({ id, namespace, flow }) {
      const dir = `_flows/${id}.${namespace}.${flow}`
      if (fs.existsSync(`${dir}/_doc/useCase.json`)) return fs.readFileSync(`${dir}/_doc/useCase.json`, 'utf-8')
      return null
    },

    // flow/documentation/getTestByFlow
    async getTestByFlow ({ idFlow }) {
      const data = await db.FLOWS.FLOW_DOC.findAll({
        attributes: ['id', 'useCase', 'test'],
        where: {
          idFlow
        },
        order: [['id', 'ASC']]
      })
      return data
    },

    /**
     * evalUseCase
     * @param {*} param0
     * @returns
     */
    async evalUseCase ({ id, namespace, flow, socket }) {
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)

      let result = ''
      let resultConsole = ''
      let initResponse = false
      const resultJson = []
      const validarText = (text) => {
        if (text.includes('- _flows/')) {
          const expresionRegular = /\*\*(.*?)\*\*/g
          const useCaseStatus = text.split(' - ')[0]
          const useCase = text.split('> \\').pop()
          const id = expresionRegular.exec(useCase)
          const time = useCase.split('time=').pop().replace('\n', '')
          result += text + '\n'
          resultJson.push({ id: parseInt(id[1]), status: useCaseStatus.indexOf('not ok') > -1 ? 'fail' : 'success', info: null, time })
        }
        if (initResponse && !text.includes('    at:')) resultConsole += text + '\n'
        if (text.includes('    ---')) initResponse = true
        if (text.includes('    ...')) initResponse = false
        if (!initResponse && resultConsole !== '') {
          resultJson[resultJson.length - 1].info = resultConsole
          resultConsole = ''
        }
      }

      return new Promise((resolve, reject) => {
        const dir = `_flows/${id}.${namespace}.${flow}`
        const { spawn } = require('child_process')
        const test = spawn('npx', ['vitest', `${dir}`, '--run', '--reporter=tap-flat', '--test-timeout=50000'])

        test.stderr.on('data', (chunk) => {
          result = chunk.toString()
        })
        test.stdout.on('data', (chunk) => {
          const text = chunk.toString()
          text.split('\n').forEach(validarText)
        })
        test.on('close', (code) => {
          console.log('close', code)
          resolve(resultJson)
          console.log(result)
        })
      })
    },
    // flow/documentation/getTest
    getTest ({ id, namespace, flow }) {
      const dir = `_flows/${id}.${namespace}.${flow}`
      if (fs.existsSync(`${dir}/_doc`)) {
        return fs.readFileSync('./test/flowTest/test.js', 'utf-8')
          .replace(/{{flow}}/g, `${id}.${namespace}.${flow}`)
      }
      return null
    },

    // flow/documentation/saveTest
    async saveTest ({ id, namespace, flow, useCase }) {
      const dir = `_flows/${id}.${namespace}.${flow}`
      try {
        if (!fs.existsSync(`${dir}/_doc`)) fs.mkdirSync(`${dir}/_doc`)
        if (useCase.test) {
          const test = useCase.test.map(f => {
            return {
              data: f.option === 'start' || f.option === 'mock' || f.option === 'result' ? f.data : null,
              connect: {
                type: f.type,
                connectName: f.connectName
              },
              node: f.node,
              option: f.option
            }
          })
          const result = await db.FLOWS.FLOW_DOC.update({
            test
          }, {
            where: {
              id: useCase.id
            }
          })
          this.generateTest({ id, namespace, flow })
          return result
        }
      } catch (error) {
        return { error: error.toString() }
      }
    },

    async generateTest ({ id, namespace, flow, index }) {
      const dir = `_flows/${id}.${namespace}.${flow}`
      try {
        if (!fs.existsSync(`${dir}/_doc`)) fs.mkdirSync(`${dir}/_doc`)
        let testFile = fs.readFileSync('./horizonServer/template/test/test.js', 'utf-8')
          .replace(/{{flow}}/g, `${id}.${namespace}.${flow}`)
          .replace(/{{port}}/g, `${index ?? id}`)

        const tests = await db.FLOWS.FLOW_DOC.findAll({
          where: {
            idFlow: id,
            test: {
              [Op.ne]: null
            }
          },
          order: [['id', 'ASC']]
        })
        const data = tests.map(m => {
          return {
            id: m.id,
            useCase: m.useCase
          }
        })
        const dataTest = tests.map(m => {
          return {
            id: m.id,
            test: m.test
          }
        })
        let txt = ''
        tests.forEach((element, index) => {
          if (txt !== '') txt += '\n'
          txt += `  it('#${index + 1}, ${element.useCase} **${element.id}**', async () => {\n    expect(convertJson(await app.Test({ useCase: ${element.id} }))).toEqual(getDataResult(${element.id}))\n  })`
        })
        testFile = testFile.replace('// {{tests}}', txt)

        if (txt !== '') fs.writeFileSync(`${dir}/_doc/index.test.js`, testFile)
        fs.writeFileSync(`./${dir}/_doc/useCase.json`, JSON.stringify(data, null, ' '))
        fs.writeFileSync(`${dir}/_doc/data.json`, JSON.stringify(dataTest, null, ' '))
      } catch (error) {
        console.log(error)
        return { error: error.toString() }
      }
    }
  }
}
