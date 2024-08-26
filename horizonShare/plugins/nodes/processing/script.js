export default class {
  constructor () {
    this.title = 'Script'
    this.desc = 'Permite ejecutar código javascript'
    this.icon = '󰑷'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.properties = {
      options: {
        label: 'Scripts:',
        type: 'list',
        object: {
          function: {
            label: 'Nombre de la función:',
            type: 'string',
            value: ''
          },
          arguments: {
            label: 'Argumentos (Separados por coma)',
            type: 'string',
            value: ''
          },
          script: {
            label: 'Script:',
            type: 'code',
            lang: ['javascript', 'Javascript'],
            value: ''
          }
        },
        value: []
      }
    }
  }

  async onExecute ({ context, outputData }) {
    try {
      const obj = {}
      this.properties.options.value.forEach((element, index) => {
        const fn = {}
        const ev = `fn.${element.function.value} = (${element.arguments.value}) => {${element.script.value}}`
        // eslint-disable-next-line no-eval
        eval(ev)
        obj[element.function.value] = fn[element.function.value]
        // console.log(element)
      })
      outputData('response', obj)
    } catch (error) {
      outputData('error', { error: error.toString() })
    }
  }
}
