export default class {
  constructor () {
    this.title = 'Indefinido'
    this.desc = 'El nodo se ha eliminado o no existe.'
    this.icon = '󰧽'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('msg')
  }

  onExecute ({ context, inputData, outputData, outputClient }) {
    outputData('msg', inputData?.data)
    // outputClient(inputData)
  }
}
