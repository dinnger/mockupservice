import { gitPromiseData } from './gitlabPromiseData.js'
import { gitPromiseParameters } from './gitlabPromiseParameter.js'
import { gitPromiseExec } from './gitlabPromiseExec.js'
import { Prometeo } from '../../../../horizonShare/prometeo.js'
import { v4 as uuid } from 'uuid'

export async function gitPromise ({ model, git, commit, resolve, session }) {
  const { get, remove } = new Prometeo()
  if (!model) return resolve({ error: 'Sin datos del flow' })

  // Si no se ha creado el repositorio
  // if (git && !data.git) {
  //   const info = await this.createRepository({ idDeploy: git.id, idFlow, idGroup: data?.flow_namespace?.idGroup, flow: { name: data.name, description: data.flow.properties.description } })
  //   // await this.createRepositoryDependencies({ idDeploy: git.id, idFlow, idGroup: data?.flow_namespace?.idGroup, flow: { name: data.name, description: data.flow.properties.description } })
  //   if (!info) return resolve({ error: 'Sin datos del flow' })
  //   data.git = info
  // }
  if (!git.git.url) return resolve({ error: 'Sin datos del flow' })
  const flowData = model.properties.value
  const PATH_URL = process.env.PATH_URL.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL
  const namespace = flowData.namespace
  const flow = `${flowData.id}.${namespace}.${flowData.name}`
  const flowName = `${flowData.name}`
  const basePath = flowData.config?.router?.base || '/'
  const splitGit = git.git.url.split('//')
  const flowUrl = process.env.BASE_URL + PATH_URL + `/ui/flows/${flowData.id}`
  let nameGit = git.git.path.split('/').pop()

  const parameters = {}
  gitPromiseParameters(git, parameters, flowData)

  let { deployPre, deployPk } = gitPromiseData({ get, model })
  deployPre = Object.entries(deployPre).map(([key, _]) => key).join('\n')
  deployPk = Object.entries(deployPk).map(([key, _]) => `RUN npm i ${key}`).join('\n')
  const newFolder = uuid()
  const command = `cd ./_deploy/ &&
    git config --global user.name "${session.alias}" &&
    git config --global user.email "${session.alias}@dinnger.com.gt" &&
    rm -R ${nameGit} ||
    git clone ${splitGit[0]}//oauth2:${git.token}@${splitGit[1]} &&
    mv ${nameGit} ${newFolder} &&
    cd ${newFolder} &&
    git checkout ${git.deployBranch}`

  try {
    remove({ path: `./_deploy/${nameGit}`, force: true, recursive: true })
  } catch (_) {
  }
  // Renombrando carpeta git
  nameGit = newFolder
  const instance = 'dev'
  const obj = {
    ...parameters,
    '{{flowId}}': flowData.id,
    '{{flow}}': flow.toLowerCase(),
    '{{flowName}}': flowName.toLowerCase(),
    '{{flowOrigin}}': flow,
    '{{basePath}}': basePath,
    '{{instance}}': instance,
    '{{deployPre}}': deployPre.replace(/\r\n/g, '\n'),
    '{{deployPk}}': deployPk.replace(/\r\n/g, '\n'),
    '{{flowUrl}}': flowUrl
  }

  gitPromiseExec({ command, obj, nameGit, git, flow, resolve, commit })
}
