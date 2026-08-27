import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth.js'
import health from './routes/health.js'
import profile from './routes/profile.js'
import spotify from './routes/spotify.js'
import playlist from './routes/playlist.js'

const app = new Hono()

app.use('*', cors())

// Global error handling
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`, err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message
    },
    500
  )
})

// 404 Not Found handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path
    },
    404
  )
})

// Base status route
app.get('/', (c) => {
  return c.json({
    name: 'Jamkudi Backend API',
    status: 'ok'
  })
})

// Mount routes
app.route('/health', health)
app.route('/auth', auth)
app.route('/profile', profile)
app.route('/spotify', spotify)
app.route('/playlist', playlist)

const port = Number(process.env.PORT) || 3000

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
