import fs from 'fs'
import { db } from '../database/connect.js'
import { createRequire } from 'node:module'

export default function () {
  return {
    async save ({ node, data, session }) {
      return db.INFO.NODES.upsert({
        node,
        data,
        active: true,
        createdUser: session.id
      })
    },
    load () {
      const require = createRequire(import.meta.url)
      return new Promise(resolve => {
        const listNodes = []
        resolve(listNodes)
      })
    },
    async doc ({ name }) {
      const result = await db.INFO.NODES.findOne({
        where: {
          node: name.toLowerCase()
        }
      })
      return result?.data || ''
    },
    async export () {
      const require = createRequire(import.meta.url)
      const listNodes = require('../../horizonShare/nodes/flow/registry.json')
      const nodes = await db.INFO.NODES.findAll({})
      console.log(listNodes.nodes)
      nodes.forEach(node => {
        const nod = listNodes.nodes.find(f => f.registry.toLowerCase().indexOf(node.node) >= 0)
        console.log(nod)
        fs.writeFileSync(`./docusaurus/docs/integrations/${nod.title}.md`, node.data)
      })

      return nodes
    }
  }
}
