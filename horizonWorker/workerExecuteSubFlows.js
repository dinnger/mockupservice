import { Executions } from './workerExecute'
export function WorkerExecuteSubFlows ({ idFlow, idSubFlow, idNode, data, outputData, outputDefault, el }) {
  const subFlows = el.context.subFlows || null
  if (subFlows) {
    const dataFlow = subFlows.find(f => f.id === idSubFlow)
    if (!dataFlow) return console.error('SubFlow no encontrado')
    const arr = dataFlow.flow.split('/')
    const name = arr.pop()
    const namespace = arr.join('.')
    const file = `_flows/${idSubFlow}.${namespace}.${name}`
    const base = el.context.properties.value.config?.router?.base

    const exec = new Executions({ el })
    const outputDataResponse = (data) => {
      outputData(outputDefault, data)
    }
    exec.initFlow({ flow: file, idNode, data, outputData: outputDataResponse, addEnvironment: { isSubFlow: true, subFlowParent: idFlow, subFlowBase: base } })
  }
}
