import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import auth from './routes/auth.js'
import health from './routes/health.js'
import profile from './routes/profile.js'

const app = new Hono()

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
