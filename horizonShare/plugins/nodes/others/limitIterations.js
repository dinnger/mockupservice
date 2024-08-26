export default class {
  constructor () {
    this.title = 'Limite de Iteraciones'
    this.desc = 'Cuando el número máximo de iteraciones es alcanzado'
    this.icon = '󱀄'
    this.autoInit = false // Por defecto es true
    this.addOutput('response')
  }

  onExecute ({ context, inputData, outputData, outputClient }) {
    outputData('response', { response: 'Iteraciones alcanzadas' })
  }
}
