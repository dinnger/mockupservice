export function WorkerInstance () {
  return {
    user: () => {
      return {
        session: ({ socket, session }) => { socket.session = session },
        position: ({ socket, session, position }) => { if (session) socket.broadcast.emit('userPos', { position, session: { id: session.id, alias: session.alias } }) }
      }
    },
    consoleOn: ({ socket }) => socket.join('console'),
    consoleOff: ({ socket }) => socket.leave('console'),
    reload: () => console.log('**RELOAD**')
  }
}
