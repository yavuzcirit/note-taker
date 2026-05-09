import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import routes from './routes'
import { apiLimiter } from './middleware/rate-limit.middleware'
import { errorHandler } from './middleware/error.middleware'

export function createApp() {
  const app = express()

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())
  app.use('/api/v1', apiLimiter, routes)

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use(errorHandler)

  return app
}
