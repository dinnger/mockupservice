import { moduleGet } from '../../horizonShare/plugins/registryServer.js'
export default function ({ app, pathUrl }) {
  app.get(`${pathUrl}/plugin/:path/:uuid/:ext`, async (req, res) => {
    const { path, uuid, ext } = req.params
    const plugin = await moduleGet({ path, uuid, ext })
    res.setHeader('Content-Type', 'application/javascript')
    res.send(plugin)
  })
}
