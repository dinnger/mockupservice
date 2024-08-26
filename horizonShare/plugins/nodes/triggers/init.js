export default class {
  constructor () {
    this.title = 'Iniciador'
    this.desc = 'Nodo que permite iniciar un flujo'
    this.icon = '󱈎'
    this.group = 'Triggers'
    this.color = '#3498DB'
    this.addOutput('init')
    this.properties = {
      typeExec: {
        label: 'Tipo de Ejecución:',
        type: 'options',
        options: [{
          label: 'por Ejecución',
          value: 'local'
        }, {
          label: 'Global',
          value: 'global'
        }],
        value: 'local'
      },
      schema: {
        label: 'Esquema de Datos',
        description: 'Si es llamado por otro flujo, informara la estructura que necesita el flujo actual',
        type: 'code',
        lang: ['json', 'JSON'],
        value: '{"dato1": "string", "dato2": "number"}'
      },
      valueDefault: {
        label: 'Valor por Defecto',
        type: 'code',
        lang: ['json', 'JSON'],
        value: '{\n}'
      }
    }
  }

  async onExecute ({ inputData, outputData }) {
    // globalExec determina que los valres ejecutados seran accesibles de forma global
    // console.log('-> init', inputData)
    const convertToJson = (text) => {
      try {
        return JSON.parse(text)
      } catch (error) {
        return text
      }
    }
    if (this.properties.typeExec.value === 'local') outputData('init', inputData?.data || convertToJson(this.properties.valueDefault.value), { nextIsTrigger: true })
    if (this.properties.typeExec.value === 'global') outputData('init', inputData?.data || convertToJson(this.properties.valueDefault.value), { globalExec: true, nextIsTrigger: true })
  }
}
