import { Prometeo } from '../../../../horizonShare/prometeo.js'
import { extractFile } from '../../../utils/utils.js'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const exec = require('child_process').exec

export function gitPromiseExec ({ command, obj, nameGit, git, flow, resolve, commit }) {
  const { get, copy, set, remove, pathDir } = new Prometeo()

  exec(command, async (err, stdout, stderr) => {
    if (!err) {
      console.log(stdout)
      console.log(stderr)
      try {
        const path = require('path')

        pathDir().new({ path: `./_deploy/${nameGit}`, recursive: true })

        const fileZip = git.file.toString('base64')

        set().file({ path: `./_deploy/_${nameGit}.zip`, data: fileZip, format: 'base64' })
        const absolutePath = path.resolve(`./_deploy/${nameGit}`)

        await extractFile({ origin: `./_deploy/_${nameGit}.zip`, destiny: absolutePath })

        remove({ path: `./_deploy/_${nameGit}.zip`, force: true, recursive: true })

        // Creando los archivos necesarios del flujo
        // copy({ sourcePath: `./_deploy/${gitDeploy}`, targetPath: `./_deploy/${nameGit}`, recursive: true })
        // Analizando
        const regex = /{{[^}]*}}/g
        const list = get().filesByPath({ path: `./_deploy/${nameGit}`, recursive: true })
        list.filter(f => !f.isDirectory && f.path.indexOf('/.git/') === -1).forEach(file => {
          const fileData = get().readFile({ path: `${file.path}/${file.name}` })
          let data = fileData.data.replace(/\r\n/g, '\n')
          const matchReplace = data.match(regex)
          if (matchReplace) {
            matchReplace.forEach(el => {
              data = data.replace(el, obj[el])
            })
            // Guardando el cambio
            set().file({ path: `${fileData.path}/${fileData.name}`, data })
          }
        })

        // Copiando archivos base
        set().newPath({ path: `./_deploy/${nameGit}/environment/`, recursive: true })
        copy({ sourcePath: './horizonServer', targetPath: `./_deploy/${nameGit}/horizonServer`, recursive: true })
        copy({ sourcePath: './horizonShare', targetPath: `./_deploy/${nameGit}/horizonShare`, recursive: true })
        copy({ sourcePath: './horizonWorker', targetPath: `./_deploy/${nameGit}/horizonWorker`, recursive: true })
        copy({ sourcePath: './server', targetPath: `./_deploy/${nameGit}/server`, recursive: true })
        copy({ sourcePath: `./_flows/${flow}`, targetPath: `./_deploy/${nameGit}/_flows/${flow}`, recursive: true })
        copy({ sourcePath: './package.json', targetPath: `./_deploy/${nameGit}/package.json`, recursive: true })
        // Modificando package para contener lo escencial
        let infoPackage = get().readFile({ path: `./_deploy/${nameGit}/package.json` })
        console.log(infoPackage.data)
        infoPackage = JSON.parse(infoPackage.data)
        delete infoPackage.devDependencies
        set().file({ path: `./_deploy/${nameGit}/package.json`, data: JSON.stringify(infoPackage, null, ' ') })
      } catch (err) {
        console.log(err)
        remove({ path: `./_deploy/_${nameGit}.zip`, force: true, recursive: true })
        remove({ path: `./_deploy/${nameGit}`, force: true, recursive: true })
        return resolve({ error: err.toString() })
      }

      command = `cd ./_deploy/${nameGit} &&
        git add . &&
        git commit -m '${commit}' &&
        git push --set-upstream origin ${git.deployBranch} `
      exec(command, function (err, stdout, stderr) {
        if (!err) {
          console.log(stdout)
          console.log(stderr)
          remove({ path: `./_deploy/${nameGit}`, force: true, recursive: true })
          resolve(stdout)
        } else {
          remove({ path: `./_deploy/${nameGit}`, force: true, recursive: true })
          return resolve({ error: 'No existen cambios a desplegar' })
        }
      })
    } else {
      return resolve({ error: err.toString() })
    }
  })
  return command
}
