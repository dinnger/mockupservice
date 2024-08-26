import fs from 'fs'
import { v4 as uuidv4, validate } from 'uuid'

const tempList = {}

export async function serverModuleLoad ({ path, uuid }) {
  try {
    const element = tempList[path] && tempList[path].find(p => p.uuid === uuid)
    const dir = `../../horizonShare/plugins/${element.path}`
    const result = await import(/* @vite-ignore */ dir)
    return result.default || result
  } catch (error) {
    console.log(error)
    return null
  }
}

export async function moduleGet ({ path, uuid, ext }) {
  if (!tempList[path]) await moduleListServer({ path })
  // valid is uuid
  const isUUID = validate(uuid)
  const plugin = tempList[path] && tempList[path].find(p => (isUUID ? p.uuid === uuid : p.file.indexOf(`${uuid}.`) === 0))
  if (!plugin) return null
  const pluginPath = plugin.path
  if (ext === 'get') {
    return fs.readFileSync(`./horizonShare/plugins/${pluginPath}`, 'utf8')
  } else {
    const external = pluginPath.split('/').slice(0, -1).join('/')
    return fs.readFileSync(`./horizonShare/plugins/${external}/${ext}`, 'utf8')
  }
}

export async function moduleListServer ({ path }) {
  if (!tempList[path]) tempList[path] = []
  if (tempList[path].length > 0) return tempList[path]
  const glob = await import('glob')
  const dir = `./horizonShare/plugins/${path}/**/*.js`
  const directory = glob.sync(dir, { ignore: ['**/node_modules/**'] })
  const arr = []
  directory.forEach((dir) => {
    const arrDir = dir.replace(/\\/g, '/').split('/')
    // Evitamos los directorios que empiezan con _
    if (arrDir.find(f => {
      return f[0] === '_'
    })) return

    arr.push({
      pathArr: arrDir.slice(2, -1),
      file: arrDir.slice(-1)[0],
      path: arrDir.slice(2, -1).join('/') + '/' + arrDir.slice(-1)[0],
      uuid: uuidv4()
    })
  })

  tempList[path] = arr
  return arr
}

export default function ({ el } = {}) {
  return {
    // module/list
    async list ({ path }) {
      return await moduleListServer({ path })
    }
  }
}
