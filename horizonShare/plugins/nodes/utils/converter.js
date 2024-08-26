export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk fast-xml-parser
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Conversión de Tipo'
    this.desc = 'Convierte un formato en otro'
    this.icon = '󰬳'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.ref = ref
    this.watch = watch
    this.properties = {
      type: {
        label: 'Tipo de conversión:',
        type: 'options',
        options: [
          {
            label: 'XML a JSON',
            value: 'xmlToJson'
          },
          {
            label: 'JSON a XML',
            value: 'jsonToXml'
          }
        ],
        value: ''
      },
      convertA: {
        label: 'Valor',
        type: 'string',
        show: ref(false),
        value: ''
      }
    }
  }

  onCreate ({ context }) {
    this.properties.type.value = this.ref(this.properties.type.value)

    const update = () => {
      this.properties.convertA.show.value = false

      if (this.properties.type.value.value === 'xmlToJson') {
        this.properties.convertA.show.value = true
      }
      if (this.properties.type.value.value === 'jsonToXml') {
        this.properties.convertA.show.value = true
      }
    }
    this.watch(this.properties.type.value, (value) => {
      update()
    })
    update()
  }

  async onExecute ({ outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)

    if (this.properties.type.value === 'xmlToJson') {
      try {
        const { XMLParser } = require('fast-xml-parser')
        const parser = new XMLParser()
        const jObj = parser.parse(this.properties.convertA.value)
        return outputData('response', jObj)
      } catch (error) {
        return outputData('error', error.toString())
      }
    }
    if (this.properties.type.value === 'jsonToXml') {
      try {
        const { XMLBuilder } = require('fast-xml-parser')
        const builder = new XMLBuilder({ format: true })
        const response = builder.build(this.properties.convertA.value)
        return outputData('response', response)
      } catch (error) {
        return outputData('error', error.toString())
      }
    }

    outputData('error', { error: 'Sin conversión' })
  }
}
