// logger.js
import 'dotenv/config'
import os from 'os'
import fs from 'fs'
import bunyan from 'bunyan'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

export const statisticsExecute = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`
    })
  ),
  transports: [
    // new winston.transports.Console(),
    new DailyRotateFile({
      filename: './logs/application-%DATE%.log',
      format: winston.format.json(),
      json: true,
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '7d'
    })
  ]
})

export const getLogs = () => {
// setInterval(() => {
  return new Promise((resolve, reject) => {
    statisticsExecute.query({ order: 'asc' },
      (err, results) => {
        if (err) {
          reject(err)
        } else {
          const data = results.dailyRotateFile
          // promedio de time
          // console.log(data)
          const groupedData = data.reduce((acc, curr) => {
            const date = new Date(curr.timestamp)
            const timestamp = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':00 hrs'
            if (!acc[timestamp]) acc[timestamp] = {}
            if (!acc[timestamp][curr.message.namespace + '.' + curr.message.name]) {
              acc[timestamp][curr.message.namespace + '.' + curr.message.name] = {
                count: 0,
                time: 0
              }
            }
            acc[timestamp][curr.message.namespace + '.' + curr.message.name].count++
            acc[timestamp][curr.message.namespace + '.' + curr.message.name].time += parseFloat(curr.message.time.toFixed(2))
            return acc
          }, {})

          const result = []
          Object.entries(groupedData).forEach(([key, value]) => {
            Object.entries(value).forEach(([k, v]) => {
              result.push({
                timestamp: key,
                name: k,
                count: v.count,
                time: parseFloat((v.time / v.count).toFixed(2))
              })
            })
          })
          resolve(result)
        }
      })
  })
}

export const loggerRegister = ({ el, time }) => {
  statisticsExecute.info({ idExecute: el.idExecute, id: el.context.properties.value.id, namespace: el.context.properties.value.namespace, name: el.context.properties.value.name, time })
}

export const loggerInstance = ({ name }) => {
  const safeCycles = bunyan.safeCycles()

  function SpecificLevelStream (levels, stream) {
    const self = this
    this.levels = {}
    levels.forEach(function (lvl) {
      self.levels[bunyan.resolveLevel(lvl)] = true
    })
    this.stream = stream
  }

  SpecificLevelStream.prototype.write = function (rec) {
    if (this.levels[rec.level] !== undefined) {
      const str = JSON.stringify(rec, safeCycles()) + '\n'
      this.stream.write(str)
    }
  }

  const pathLogs = `${process.env.LOG_PATH}/appEvent_${name.split('.').pop()}.out`
  const pathErr = `${process.env.LOG_PATH}/errEvent_${name.split('.').pop()}.err`

  const stream = process.env.LOG_LEVEL === 'DEBUG' ? ['DEBUG', 'INFO'] : [`${process.env.LOG_LEVEL}`]
  return bunyan.createLogger({
    name: name.split('.').pop(),
    hostname: os.hostname() + ':' + process.env.HOST_IP,
    streams: [{
      level: `${process.env.LOG_LEVEL}`,
      type: 'raw',
      stream: new SpecificLevelStream(stream,
        fs.createWriteStream(pathLogs, { flags: 'a', encoding: 'utf8' }))
    }, {
      level: 'error',
      path: pathErr
    }],
    apiKey: '',
    uri: '',
    responseCode: '',
    responseTime: '',
    clientIP: ''
  })
}
