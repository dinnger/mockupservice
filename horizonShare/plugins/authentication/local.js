import express from 'express'

export default function ({ validLogin, validPassword, loadInformation, loadInformationUser, saveNewUser, generateToken }) {
  const router = express.Router()
  router.post('/', async (req, res, next) => {
    if (!validLogin(req)) return res.status(403).json('Datos inválidos')
    const userLocal = await loadInformation(req)
    if (!userLocal || userLocal.length === 0) return res.status(403).json('Datos inválidos')
    const user = userLocal[0]
    if (!validPassword(req.body.password, user.password)) return res.status(403).json('Datos inválidos')
    await saveNewUser(req)
    const userV = await loadInformationUser(user.alias)
    const id = userV?.id || null
    res.status(200).json({
    // id: user.id,
      alias: user.alias,
      avatar: userV.avatar,
      token: generateToken({ id, alias: user.alias })
    })
  })
  return router
}
