import appFlow from './appFlow.js'
import appDatabase from './appDatabase.js'
import appProcess from './appProcess.js'
import appSecurity from './appSecurity.js'
import appNode from './appFlowNode.js'
import appLogs from './appLogs.js'
import appJira from './appJira.js'
import appModule from './../../horizonShare/plugins/registryServer.js'

import { HorizonWorker } from '../../horizonWorker/index.js'
const worker = new HorizonWorker()

export function App () {
  // /root
  return {
    flow: appFlow,
    process: appProcess,
    security: appSecurity,
    database: appDatabase,
    node: appNode,
    logs: appLogs,
    jira: appJira,
    module: appModule,
    worker: worker.workerSocket
  }
}
