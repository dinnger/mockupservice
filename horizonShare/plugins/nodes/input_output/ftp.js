export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk basic-ftp
  // #pk ssh2-sftp-client
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Transferencia de Archivos'
    this.desc = 'Permite subir archivos ftp'
    this.icon = '󰲁'
    this.addInput('input')
    this.addOutput('response')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      type: {
        label: 'Tipo de conexión:',
        type: 'options',
        options: [{
          label: 'FTP',
          value: 'ftp'
        }, {
          label: 'SFTP',
          value: 'sftp'
        }],
        value: 'ftp'
      },
      sftp: {
        label: '',
        type: 'group',
        show: false,
        object: {
          host: {
            label: 'Host:',
            type: 'string',
            value: '',
            size: 2
          },
          type: {
            label: 'Tipo:',
            type: 'options',
            options: [{
              label: 'Subir',
              value: 'upload'
            }, {
              label: 'Descargar',
              value: 'download'
            }],
            value: 'upload',
            size: 1
          },
          user: {
            label: 'Usuario:',
            type: 'string',
            size: 2,
            value: ''
          },
          password: {
            label: 'Contraseña:',
            type: 'string',
            size: 2,
            value: ''
          },
          key: {
            label: 'Seguridad (Archivo *.pem): ',
            type: 'string',
            size: 4,
            value: ''
          },
          fileName: {
            label: 'Nombre del Archivo:',
            description: 'Es posible agregar la ruta completa del archivo',
            type: 'string',
            size: 2,
            value: ''
          },
          file: {
            label: 'Archivo (buffer):',
            type: 'string',
            size: 2,
            value: ''
          }
        }
      },
      ftp: {
        label: '',
        type: 'group',
        show: false,
        object: {
          host: {
            label: 'Host:',
            type: 'string',
            value: '',
            size: 2
          },
          type: {
            label: 'Tipo:',
            type: 'options',
            options: [{
              label: 'Subir',
              value: 'upload'
            }, {
              label: 'Descargar',
              value: 'download'
            }],
            value: 'upload',
            size: 2
          },
          user: {
            label: 'Usuario:',
            type: 'string',
            size: 2,
            value: ''
          },
          password: {
            label: 'Contraseña:',
            type: 'string',
            size: 2,
            value: ''
          },
          fileName: {
            label: 'Nombre del Archivo:',
            description: 'Es posible agregar la ruta completa del archivo',
            type: 'string',
            size: 2,
            value: ''
          },
          file: {
            label: 'Archivo (buffer):',
            type: 'string',
            size: 2,
            value: ''
          }
        }
      }
    }
  }

  async onCreate () {
    this.properties.sftp.show = this.ref(this.properties.sftp.show)
    this.properties.ftp.show = this.ref(this.properties.ftp.show)
    this.properties.type.value = this.ref(this.properties.type.value)

    const update = () => {
      const type = this.properties.type.value.value
      this.properties.sftp.show.value = false
      this.properties.ftp.show.value = false

      if (type === 'ftp') this.properties.ftp.show.value = true
      if (type === 'sftp') this.properties.sftp.show.value = true
    }
    this.watch(this.properties.type.value, (value) => {
      update()
    })
    update()
  }

  async onExecute ({ outputData, files }) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const { Readable } = await import('node:stream')

    if (this.properties.type.value === 'sftp') {
      const Client = require('ssh2-sftp-client')
      const { Readable } = await import('node:stream')

      const client = new Client()
      try {
        let privateKey = null
        const type = this.properties.sftp.value.type.value
        const host = this.properties.sftp.value.host.value
        const username = this.properties.sftp.value.user.value
        const password = this.properties.sftp.value.password.value !== '' ? this.properties.sftp.value.password.value : null
        const fileKey = this.properties.sftp.value.key.value
        const fileName = this.properties.sftp.value.fileName.value
        const fileBuffer = this.properties.sftp.value.file.value

        if (fileKey) {
          privateKey = await files.get({ fileName: fileKey })
          if (!privateKey) return outputData('error', { error: 'No se encontró el archivo PEM' })
        }

        const conf = { host, username, password, privateKey }
        // client.ftp.verbose = true
        client.connect(conf)
          .then(async () => {
            if (type === 'upload') {
              const stream = Readable.from(fileBuffer)
              await client.put(stream, fileName)
              client.end()
              outputData('response', { response: 'Archivo subido exitosamente.' })
            }
            if (type === 'download') {
              await client.get(fileName, files.temporal(file => {
                outputData('response', { file })
              }))
              client.end()
            }
          })
          .catch(err => {
            outputData('error', { error: err.toString() })
          })
      } catch (err) {
        outputData('error', { error: err.toString() })
        client.end()
      }
    }

    if (this.properties.type.value === 'ftp') {
      const { Client } = require('basic-ftp')

      const client = new Client()
      client.ftp.verbose = true
      try {
        const type = this.properties.ftp.value.type.value
        const host = this.properties.ftp.value.host.value
        const user = this.properties.ftp.value.user.value
        const password = this.properties.ftp.value.password.value !== '' ? this.properties.ftp.value.password.value : null
        const fileName = this.properties.ftp.value.fileName.value
        const fileBuffer = this.properties.ftp.value.file.value
        const conf = { host, user, password }
        await client.access(conf)

        client.trackProgress(info => console.log(info.bytesOverall))
        if (type === 'upload') {
          const stream = Readable.from(fileBuffer)
          await client.uploadFrom(stream, fileName)
          outputData('response', { response: 'Archivo subido exitosamente.' })
          client.close()
        }
        if (type === 'download') {
          await client.downloadTo(files.temporal(file => {
            outputData('response', { file })
          }), fileName)

          client.close()
        }
      } catch (err) {
        outputData('error', { error: err.toString() })
        client.close()
      }
    }
  }
}
