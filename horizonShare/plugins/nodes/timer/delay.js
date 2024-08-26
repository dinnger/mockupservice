export default class {
  constructor () {
    this.title = 'Delay'
    this.desc = 'Show value inside the console'
    this.icon = '󱫞'

    this.addInput('input')
    this.addOutput('response', 0)
    this.properties = {
      delay: {
        label: 'Tiempo de Espera (seg)',
        type: 'number',
        value: 3
      }
    }
  }

  async onExecute ({ inputData, outputData }) {
    setTimeout(() => {
      outputData('response', inputData.data)
    }, this.properties.delay.value * 1000)
  }
}
