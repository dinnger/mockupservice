export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk nodemailer
  // ===============================================
  constructor () {
    this.title = 'Correo'
    this.desc = 'Envío de correo'
    this.icon = '󰇮'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')
    this.properties = {
      config: {
        type: 'code',
        lang: ['json', 'JSON'],
        value: `{
  "host":"",
  "port":465,
  "secure": false,
  "requireTLS": true,
  "tls": {
    "rejectUnauthorized": false
  },
  "auth": {
    "user":"",
    "pass":""
  }
}`
      },
      message: {
        label: 'Mensaje:',
        type: 'code',
        lang: ['json', 'JSON'],
        value: `{
  "from":"",
  "to":"",
  "subject":"",
  "html":"",
  "attachments": [
    { 
      "filename": "",
      "content": ""
    }
  ]
}`
      }
    }
  }

  async onExecute ({ outputData }) {
    try {
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport(JSON.parse(this.properties.config.value))
      const main = async () => {
        const msg = JSON.parse(this.properties.message.value)
        // convertir el contenido de los archivos adjuntos a buffer
        if (msg.attachments) {
          msg.attachments = msg.attachments.map(attachment => {
            const content = (typeof attachment.content === 'string') ? JSON.parse(attachment.content) : attachment.content
            return {
              filename: attachment.filename,
              content: Buffer.from(content, 'base64')
            }
          })
        }
        const info = await transporter.sendMail(msg)
        outputData('response', info)
      }
      main().catch((err) => {
        console.error(err)
        outputData('error', { error: err })
      })
    } catch (error) {
      outputData('error', { error })
    }
  }
}
