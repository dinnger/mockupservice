import express from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

export default function ({ app, appInstance, generateToken }) {
  app.use(passport.initialize())
  // app.use(passport.session())

  let userProfile
  const router = express.Router()
  const config = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  }
  passport.use(
    new GoogleStrategy(config,
      function (accessToken, refreshToken, profile, done) {
        userProfile = profile
        return done(null, userProfile)
      }
    )
  )

  // request at /auth/google, when user click sign-up with google button transferring
  // the request to google server, to show emails screen
  router.get(
    '/',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  )

  router.get(
    '/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/ui/login?auth=google&error=true' }),
    async (req, res) => {
      // console.log(req.user)

      // Validando user
      let user = await appInstance.security().user().get({ alias: req.user._json.email })
      if (!user) {
        user = await appInstance.security().user().new({
          alias: req.user._json.email,
          google: {
            name: req.user._json.name,
            email: req.user._json.email,
            id: req.user.id,
            picture: req.user._json.picture
          }
        })
      }
      const PATH_URL = process.env.PATH_URL?.slice(-1) === '/' ? process.env.PATH_URL.toString().slice(0, -1) : process.env.PATH_URL ?? ''
      res.redirect(PATH_URL + `/ui/login?auth=google&token=${generateToken({ id: user.id, alias: req.user._json.email })}`)
    }
  )

  router.get('/success', async (req, res) => {
    res.render('success', { user: userProfile })
  })

  router.get('/error', (req, res) => res.send('Error logging in via Google..'))

  router.get('/signout', (req, res, next) => {
    try {
      req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
      })
    } catch (err) {
      res.status(400).send({ message: 'Failed to sign out user' })
    }
  })
  return router
}
