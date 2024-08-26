export default class {
  constructor () {
    this.title = 'Response Stream'
    this.desc = 'Return stream'
    this.icon = '󰌑'
    this.pos = { w: 380, h: 130 }
    // this.addProperty('msg', '')
    this.addInput('input')
    this.properties = {
      type: {
        label: 'Tipo de Respuesta:',
        type: 'options',
        options: [{
          label: 'Archivos Pesados',
          value: 'stream'
        }, {
          label: 'Descarga',
          value: 'download'
        }],
        value: 'stream'
      },
      filePath: {
        label: 'Directorio Archivo:',
        type: 'string',
        value: '{{Webhook.data.query.filePath}}'
      },
      contentType: {
        label: 'Tipo:',
        type: 'string',
        value: 'video/mp4'
      }
    }
  }

  async onExecute ({ context, outputData }) {
    const fs = await import('fs')
    const node = context.getNodeByType('input_output/webhook')
    const ifExecute = context.ifExecute()
    if (!ifExecute) {
      try {
        if (this.properties.type.value === 'download') {
          const download = Buffer.from(this.properties.filePath.value, 'base64')
          node.meta.res.end(download)
        }
        if (this.properties.type.value === 'stream') {
          const filePath = this.properties.filePath.value
          const stat = fs.statSync(filePath)
          const fileSize = stat.size
          const range = node.meta.req.headers.range || 'bytes=0-'
          if (range) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + (10 ** 6), fileSize - 1)// fileSize - 1

            const chunksize = end - start + 1
            const file = fs.createReadStream(filePath, { start, end })
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': this.properties.contentType.value
            }
            // console.log(head)
            node.meta.res.writeHead(206, head)
            file.pipe(node.meta.res)
          }
        }
      } catch (error) {
        console.log(error)
        node.meta.res.status(400).send(error)
      }
    }
    outputData()
  }
}
