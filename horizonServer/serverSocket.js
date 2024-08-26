import { Server } from 'socket.io'

export async function connectToSocket ({ server, path, allowedOrigins, isDev }) {
  console.log('[Server]', 'Conectando a socket', path)
  const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    path,
    cors: {
      credentials: true,
      origin: allowedOrigins
    }
  })

  io.on('connection', async (socket) => {
    socketProxy({ socket, isDev })
  })
}

async function socketProxy ({ socket, isDev }) {
  const { App } = await import('./application/app.js')

  socket.onAny((event, ...args) => {
    const params = args.length > 0 ? typeof args[0] === 'object' ? args[0] : {} : {}
    const callback = args.length === 2 ? args[1] : typeof args[0] === 'function' ? args[0] : null
    const obj = event.split('/')
    let tempRegister = { ...App() }

    const exec = async (index) => {
      if (index >= obj.length) {
        if (callback) callback(tempRegister)
        return
      }
      const name = obj[index]
      if (tempRegister[name]) {
        if (params.session) delete params.session // Eliminando parámetro de sesión para evitar inyección
        tempRegister = await tempRegister[name]({ socket, session: socket.session, ...params })
        exec(index + 1)
      } else {
        if (callback) callback({ error: '(Socket) Etiqueta no definida.' })
        console.log('[Server] [Socket] No existe el registro', event)
      }
    }
    exec(0)
  })
}
