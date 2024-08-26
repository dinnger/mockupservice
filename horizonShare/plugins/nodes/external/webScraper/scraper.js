export default class {
  constructor ({ ref, watch }) {
    this.title = 'Web Scraper'
    this.group = 'Externo/Scraper'
    this.desc = 'Permite obtener datos de una página web'
    this.icon = '󰜏'
    this.addInput('input')
    this.addOutput('output')
    this.addOutput('error')

    this.ref = ref
    this.watch = watch

    this.properties = {
      url: {
        label: 'Url:',
        type: 'string',
        value: ''
      }
    }
  }

  async onExecute ({ context, inputData, outputData, outputClient }) {
    try {
      const puppeteer = await import('puppeteer')
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.goto(this.properties.url.value)
      await page.goto(this.properties.url.value)

      outputData('output', { response: 'ok' }, { page })
    } catch (error) {
      outputData('error', { error })
    }
  }
}
