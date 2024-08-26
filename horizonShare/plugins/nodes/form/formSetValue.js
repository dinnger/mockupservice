export default class {
  constructor () {
    this.title = 'Definir Variable'
    this.desc = 'Definir valor a una variable'
    this.icon = '󱓙'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      variableForm: {
        type: 'group',
        label: 'Valor del Formulario:',
        value: '',
        object: {
          variable: {
            type: 'code',
            lang: ['json', 'JSON'],
            value: '{\n}'
          }
        }
      },
      variableGlobal: {
        type: 'group',
        label: 'Valor global (persistente):',
        value: '',
        object: {
          variable: {
            type: 'code',
            lang: ['json', 'JSON'],
            value: '{\n}'
          }
        }
      }

    }
  }

  onExecute ({ inputData, context, outputData }) {
    let node = null
    node = context.getNodeByType('form/form')
    try {
      if (node?.meta?.socket) {
        node.meta.socket.emit('setValue', {
          variable: this.properties.variableForm.value.variable.value,
          global: this.properties.variableGlobal.value?.variable.value
        })
      }
      return outputData('response', inputData.data)
    } catch (error) {
      return outputData('error', { statusCode: 500, error })
    }
  }
}
