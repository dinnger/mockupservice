export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // ===============================================
  constructor () {
    this.title = 'Ejecución Paralela'
    this.desc = 'Procesa multiples entradas en paralelo.'
    this.icon = '󰽜'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      type: {
        label: 'Tipo de validación de paralelismo:',
        type: 'options',
        options: [
          {
            label: 'Esperar todas las ejecuciones',
            value: 'allParallel'
          },
          {
            label: 'Primer resultado',
            value: 'firstParallel'
          }
        ],
        value: 'allParallel'
      }
    }
  }

  async onExecute ({ inputData, execution, context, outputData }) {
    // Se guarda el id del nodo que se está ejecutando
    const store = execution.store
    if (!store[context.idNode]) store[context.idNode] = { executions: {} }
    store[context.idNode].executions[inputData.idNode] = 1

    // Si existen todas las entradas, se procede a ejecutar la salida
    if (this.properties.type.value === 'allParallel') {
      // Verificar si en el objeto de ejecuciones ya se encuentran todas las entradas
      const executions = Object.keys(store[context.idNode].executions)
      // Verificar si existen todos los inputs (context.inputs[context.idNode]) dentro de executions
      const allInputs = context.inputs[context.idNode].every(input => executions.includes(input.key))
      if (allInputs) outputData('response', { response: 'Ok' })
    } else {
      outputData('response', { response: 'Ok' })
    }
  }
}
