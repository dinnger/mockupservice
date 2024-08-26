import WORKER from '../horizonWorker/worker.ts'

// SECURITY
async function server ({ type, file, port }) {
  const worker = new WORKER({
    type,
    port,
    file,
    isDev: false
  })
  await worker.start({ isTest: true })
  return {
    Test: async ({ useCase }) => {
      return new Promise(resolve => {
        worker.initExecute({
          test: (data) => resolve(data),
          useCase
        })
      })
    }
  }
}

export default server

if (process.argv[3]) {
  server({ type: process.argv[2], file: process.argv[3], port: process.argv[4] || 3000 })
  // servicio.intSwagger()
}
