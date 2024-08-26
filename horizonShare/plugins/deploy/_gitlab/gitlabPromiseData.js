export function gitPromiseData ({ get, model }) {
  const deployPre = {}
  const deployPk = {}
  const infoPackage = JSON.parse(get().readFile({ path: './package.json' }).data)
  const nodes = model.nodes.value
  Object.entries(nodes).forEach(([key, item]) => {
    const classString = model.nodesClass[item.type].class.toString()
    classString
      .split('\n')
      .filter(f => f.indexOf('// #pre') >= 0 || f.indexOf('// #pk') >= 0)
      .forEach(m => {
        if (m.indexOf('// #pre') >= 0) {
          const obj = m.substring(m.indexOf('// #pre') + 7).trim()
          deployPre[obj] = 1
        }
        if (m.indexOf('// #pk') >= 0) {
          const obj = m.substring(m.indexOf('// #pk') + 6).trim()
          const version = infoPackage.dependencies[obj] ?? infoPackage.devDependencies[obj]
          if (version) deployPk[`${obj}@${version.replace(/\^/g, '')}`] = 1
          if (!version) deployPk[`${obj}`] = 1
        }
      })
  })
  return { deployPre, deployPk }
}
