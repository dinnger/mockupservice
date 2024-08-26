import { resolve } from 'node:path'

export function fields () {
  return {
    properties: {
      icon: 'mdi-server'
    },
    elements: {
      url: {
        label: 'URL',
        type: 'string',
        required: true
      },
      token: {
        label: 'Token',
        type: 'string',
        required: true
      },
      primaryBranch: {
        label: 'Rama principal',
        type: 'string',
        required: true,
        size: 1
      },
      deployBranch: {
        label: 'Rama de despliegue',
        type: 'string',
        required: true,
        size: 1
      },
      branches: {
        label: 'Lista de ramas',
        type: 'tags',
        required: true,
        size: 2,
        description: 'Ramas que se crearán en el repositorio'
      },
      file: {
        label: 'Archivo de despliegue',
        type: 'file',
        required: true,
        options: {
          accept: '.zip'
        },
        size: 4
      }
    }
  }
}

export class Deploy {
  constructor ({ path, dataReplace, dataGit, flowGit, commit, session }) {
    this.path = path
    this.dataReplace = dataReplace
    this.dataGit = dataGit
    this.commit = commit
    this.flowGit = flowGit
    this.session = session
  }

  async init () {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const axios = require('axios')
    const exec = require('child_process').exec

    const { flowId, flow, flowName, flowOrigin, basePath, instance, deployPre, deployPk, flowUrl } = this.dataReplace

    let { branches, deployBranch, primaryBranch, url, token } = this.dataGit?.data?.elements

    url = url.value
    token = token.value
    primaryBranch = primaryBranch.value
    deployBranch = deployBranch.value

    const owner = url.split('/').pop()

    const data = JSON.stringify({
      name: flowName,
      description: 'Despliegue automático',
      homepage: flowUrl,
      private: false,
      has_issues: true,
      has_projects: true,
      has_wiki: true,
      auto_init: true,
      gitignore_template: 'Node'
    })
    const tk = token
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.github.com/user/repos',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${tk}`
      },
      data
    }

    const config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.github.com/repos/${owner}/${flowName}/git/refs/heads/${primaryBranch}`,
      headers: {
        Authorization: `Bearer ${tk}`
      },
      data
    }

    // Crear branch de despliegue (conf axios)
    const config3 = (sha) => {
      return {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.github.com/repos/${owner}/${flowName}/git/refs`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tk}`
        },
        data: {
          ref: `refs/heads/${deployBranch}`,
          sha
        }
      }
    }

    return new Promise(async (resolve, reject) => {
      try {
        let resp = null
        if (!this.flowGit.url) {
          resp = await axios.request(config)
          const respPrimaryBranch = await axios.request(config2)
          const sha = respPrimaryBranch.data.object.sha
          await axios.request(config3(sha))
        }
        const urlGit = resp?.data?.clone_url || this.flowGit.url
        const urlGitHub = urlGit.split('//')[0] + '//' + tk + '@' + urlGit.split('//')[1]
        const command = `cd ./_deploy &&
      git config --global user.name "${this.session.alias}" &&
      git config --global user.email "${this.session.alias}@dinnger.com.gt" &&
      git clone ${urlGitHub} && 
      cd ${flowName} &&
      git pull --all &&
      git checkout ${deployBranch} &&
      git pull &&
      cp ../${this.path}/* ./ -rf &&
      git add . &&
      git commit -m '${this.commit}' &&
      git push -f`
        exec(command, function (err, stdout, stderr) {
          if (!err) {
            resolve({
              urlGit
            })
          } else {
            reject(err)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}
