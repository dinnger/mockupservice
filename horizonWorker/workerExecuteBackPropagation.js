import { initProperties } from './workerExecuteProperties'
export function backPropagationCreate ({ nodeName, nodeId, reference, context }) {
  if (reference.indexOf('.') === -1) return
  const backPropagationName = `${nodeName}_backPropagation`
  if (!context.getStore(backPropagationName)) context.setStore(backPropagationName, { reference: [] })
  context.getStore(backPropagationName).reference.push({
    node: nodeId,
    reference
  })
}

export function backPropagationExec ({ context }) {
  const node = context.nodes.value[context.idNode]
  const backPropagationName = `${node.title}_backPropagation`
  if (context.getStore(backPropagationName) && context.getStore(backPropagationName).reference) {
    context.getStore(backPropagationName).reference.forEach((item, index) => {
      const node = context.getNodeById({ idNode: item.node })
      if (!node) return
      const { meta } = node
      const socket = meta?.socket
      if (socket) {
        const reference = item.reference
        const value = initProperties({ properties: { reference: { value: reference } }, node, input: { }, context, isBackPropagation: true })
        socket.emit('changeProperty', { reference: item.reference, value: value.reference.value })
      }
    })
  }
}
