import { getLogs } from '../../horizonWorker/workerExecuteLogs.js'

export default function ({ el } = {}) {
  return {
    /**
     * infoFlow
     * @param {*} param0
     * @returns
    */
    //  flow/infoFlow
    async globalLogs ({ session }) {
      try {
        const data = await getLogs()
        return data
      } catch (error) {
        return null
      }
    }
  }
}
