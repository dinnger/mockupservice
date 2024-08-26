export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk json-as-xlsx
  // #pk @json2csv/plainjs
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Archivo'
    this.desc = 'Permite generar diferentes tipos de archivos a partir de un json'
    this.icon = '󰢪'
    this.group = 'Procesamiento'
    this.color = '#F39C12'

    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      type: {
        label: 'Tipo de archivo:',
        type: 'options',
        options: [{
          label: 'xlsx',
          value: 'xlsx'
        }, {
          label: 'csv',
          value: 'csv'
        }],
        value: 'xlsx'
      },
      options: {
        label: 'Hoja de Calculo:',
        type: 'list',
        object: {
          sheet: {
            label: 'Nombre:',
            type: 'string',
            value: ''
          },
          columns: {
            label: 'Columnas:',
            type: 'code',
            lang: ['json', 'Json'],
            value: ''
          },
          content: {
            label: 'Contenido:',
            type: 'code',
            lang: ['json', 'Json'],
            value: ''
          }
        },
        value: [],
        show: true
      },
      csv: {
        label: 'Hoja de Calculo:',
        type: 'group',
        object: {
          delimiter: {
            label: 'Delimitador',
            type: 'string',
            value: ',',
            size: 1
          },
          headers: {
            label: 'Encabezado:',
            description: 'Incluir encabezado en el archivo',
            type: 'switch',
            value: true,
            size: 1
          },
          includeEmptyRows: {
            label: 'Incluir vacía:',
            description: 'Incluir filas vacías en el archivo',
            type: 'switch',
            value: false,
            size: 1
          },
          removeQuotes: {
            label: 'Comillas:',
            description: 'Incluir comillas para separar los valores.',
            type: 'switch',
            value: true,
            size: 1
          },
          data: {
            label: 'Datos:',
            type: 'code',
            lang: ['json', 'Json'],
            value: ''
          }
        },
        show: false
      }
    }
  }

  onCreate ({ context }) {
    this.properties.type.value = this.ref(this.properties.type.value)
    this.properties.options.show = this.ref(this.properties.options.show)
    this.properties.csv.show = this.ref(this.properties.csv.show)

    const update = () => {
      this.properties.options.show.value = false
      this.properties.csv.show.value = false

      if (this.properties.type.value.value === 'xlsx') {
        this.properties.options.show.value = true
      }
      if (this.properties.type.value.value === 'csv') {
        this.properties.csv.show.value = true
        // this.properties.options.show.value = true
      }
    }
    this.watch(this.properties.type.value, (value) => {
      update()
    })
    update()
  }

  async onExecute ({ context, outputData }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const converJson = (text) => {
      try {
        return JSON.parse(text)
      } catch (error) {
        return text
      }
    }

    try {
      if (this.properties.type.value === 'xlsx') {
        const xlsx = require('json-as-xlsx')
        const settings = {
          fileName: 'MySpreadsheet', // Name of the resulting spreadsheet
          // extraLength: 3, // A bigger number means that columns will be wider
          writeMode: 'WriteFile', // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
          writeOptions: {
            type: 'buffer' // 'file' or 'buffer' (the default value is 'file')
          }, // Style options from https://docs.sheetjs.com/docs/api/write-options
          RTL: false // Display the columns from right-to-left (the default value is false)
        }
        const elements = []
        this.properties.options.value.forEach(element => {
          if (element.sheet && element.columns && element.content) {
            elements.push({
              sheet: element.sheet.value,
              columns: converJson(element.columns.value),
              content: converJson(element.content.value)
            })
          }
        })
        const buffer = xlsx(elements, settings)
        outputData('response', { file: buffer })
      }
      if (this.properties.type.value === 'csv') {
        const { Parser } = await import('@json2csv/plainjs')
        const data = this.properties.csv.value.data.value
        const parser = new Parser({
          delimiter: this.properties.csv.value.delimiter.value,
          header: this.properties.csv.value.headers.value,
          includeEmptyRows: this.properties.csv.value.includeEmptyRows.value
        })

        let csv = await parser.parse(data)
        if (!this.properties.csv.value.removeQuotes.value) {
          csv = csv.replace(/"/g, '')
        }
        const buffer = Buffer.from(csv, 'utf-8')
        outputData('response', { file: buffer })
      }
    } catch (err) {
      outputData('error', { error: err.toString() })
    }
  }
}
