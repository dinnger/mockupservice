import express from 'express'

export default function ({ validLogin, loadLDAP, loadInformationUser, saveNewUser, generateToken }) {
  const router = express.Router()
  router.post('/', async (req, res) => {
    if (!validLogin(req)) return res.status(403).json('Datos inválidos')
    const userLDAP = await loadLDAP(req)
    if (!userLDAP || !userLDAP.alias) return res.status(403).json('Datos inválidos')
    await saveNewUser(req)
    const user = await loadInformationUser(userLDAP.alias)
    const id = user?.id || null
    res.status(200).json({
    // id,
      alias: userLDAP.alias,
      avatar: user.avatar,
      token: generateToken({ id, alias: userLDAP.alias })
    })
  })
  return router
}
