import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export async function getScopes ({ scopes }) {
  const scope = {}
  if (!scopes) return scope
  const getScope = async (index) => {
    if (index >= scopes.length) return scope
    const f = scopes[index]

    // Agregando scope
    if (f === 'axios') scope[f] = require('axios')

    await getScope(index + 1)
  }
  await getScope(0)
  return scope
}
