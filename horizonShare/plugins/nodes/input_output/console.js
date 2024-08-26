export default class {
  constructor () {
    this.title = 'Console'
    this.desc = 'Muestra el valor en consola'
    this.icon = '󱀄'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.addOutput('msg')

    this.properties = {
      msg: {
        type: 'string',
        value: '{{input.data}}',
        label: 'Mensaje',
        description: 'Mensaje a mostrar en consola'
      }
    }
  }

  onExecute ({ context, inputData, outputData, outputClient }) {
    console.log(this.title, this.properties.msg.value)
    outputData('msg', inputData.data)
    // outputClient(inputData)
  }

  onExecuteClient (inputData) {
    console.log(this.title, inputData)
    // console.log(input.data)
  }
}
