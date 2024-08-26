export default class {
  // ===============================================
  // Dependencias
  // ===============================================
  // #pk cron
  // ===============================================
  constructor ({ ref, watch }) {
    this.title = 'Timer'
    this.desc = 'Temporizador de tiempo.'
    this.icon = '󰔟'
    this.pos = { w: 380, h: 130 }
    this.ref = ref
    this.watch = watch
    this.isTrigger = true

    this.addInput('input')
    this.addOutput('tick', 0)
    this.properties = {
      cron: {
        label: 'Configuración de cron:',
        type: 'string',
        value: '*/10 * * * * *'
      },
      timezone: {
        label: 'Zona horaria:',
        type: 'string',
        value: 'America/Guatemala'
      },
      response: {
        label: 'Tipo de respuesta:',
        type: 'options',
        options: [{
          label: 'Texto',
          value: 'text'
        }, {
          label: 'Contador',
          value: 'count'
        }],
        value: 'text'
      },
      data: {
        label: 'Salida',
        type: 'string',
        value: 'tick!',
        show: ref(false)
      },
      countInit: {
        label: 'Valor Inicial',
        type: 'number',
        value: 0,
        show: ref(false)
      },
      countMax: {
        label: 'Valor Máximo',
        type: 'number',
        value: null,
        show: ref(false)
      },
      countInterval: {
        label: 'Intervalo',
        type: 'number',
        value: 1,
        show: ref(false)
      }
    }
  }

  onCreate ({ context }) {
    this.properties.response.value = this.ref(this.properties.response.value)

    const update = () => {
      const response = this.properties.response.value.value
      this.properties.data.show.value = false
      this.properties.countInit.show.value = false
      this.properties.countMax.show.value = false
      this.properties.countInterval.show.value = false
      if (response === 'text') {
        this.properties.data.show.value = true
      }
      if (response === 'count') {
        this.properties.countInit.show.value = true
        this.properties.countMax.show.value = true
        this.properties.countInterval.show.value = true
      }
    }

    this.watch(this.properties.response.value, value => {
      update()
    })
    update()
  }

  async onExecute ({ outputData }) {
    let temporalCount = this.properties.countInit.value || 0
    try {
      const { CronJob } = await import('cron')
      const job = new CronJob(
        this.properties.cron.value, // cronTime
        () => {
          if (this.properties.response.value === 'text') {
            outputData('tick', this.properties.data.value)
          }
          if (this.properties.response.value === 'count') {
            outputData('tick', temporalCount)
            temporalCount += this.properties.countInterval.value
            if (this.properties.countMax.value !== 0) {
              if (this.properties.countMax.value < 0 && temporalCount <= this.properties.countMax.value) {
                job.stop()
              }
              if (this.properties.countMax.value > 0 && temporalCount >= this.properties.countMax.value) {
                job.stop()
              }
            }
          }
        }, // onTick
        null, // onComplete
        true, // start
        this.properties.timezone.value // timeZone
      )
    } catch (error) {
      console.log(error.toString())
    }
  }
}
