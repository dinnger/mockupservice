export default class {
  constructor ({ ref, watch }) {
    this.title = 'Acciones'
    this.group = 'Externo/Scraper'
    this.desc = 'Permite realizar acciones en la página web'
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
    const toDataURL = async (callback) => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const fs = await import('fs')

      const genAI = new GoogleGenerativeAI('AIzaSyAZ501aLKR_Hw-J44fnh9rUmh6eGGiTEXw')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

      const prompt = 'que dice la imagen solo las letras azules'
      const image = {
        inlineData: {
          data: Buffer.from(fs.readFileSync('example.png')).toString('base64'),
          mimeType: 'image/png'
        }
      }

      const result = await model.generateContent([prompt, image])
      console.log(result.response.text())
      callback(result.response.text().trim())
    }

    let retryCount = 0
    const retry = async (page, frames) => {
      await page.screenshot({
        path: 'example.png',
        clip: {
          x: 320,
          y: 260,
          width: 160,
          height: 100
        }
      })
      toDataURL(async (text) => {
        console.log('text', text)
        await frames.evaluate((data) => {
          document.querySelector('table:nth-child(1) input[type=text]').setValue(data.text)
        }, { text })
        await page.screenshot({ path: 'example3.png' })
        await frames.$eval('table:nth-child(1) input[type=submit]', element => element.click())

        setTimeout(async () => {
          const exist = await frames.$eval('input[type=submit]', element => element.value)
          await page.screenshot({ path: 'example3.png' })
          console.log('exist------>', exist)
          if (exist.trim().indexOf('Llenar SAT') === -1) return
          retryCount++
          if (retryCount < 10) retry(page, frames)
        }, 2000)
      })
    }

    try {
      const scraper = context.getNodeByType('external/webScraper/scraper')
      if (!scraper) return outputData('error', { error: 'No se encontró el nodo de scraper' })
      const page = await scraper.meta.page
      const frames = await page.frames().find(frame => {
        return frame.name().indexOf('iframe') !== -1
      })
      await setTimeout(async () => {
        console.log('frames')
        await frames.$eval('table tr:nth-child(4) a', element => element.click())

        setTimeout(async () => {
          retry(page, frames)
        }, 2000)
      }, 2000)
    } catch (error) {
      console.log(error)
      outputData('error', { error })
    }
  }
}
