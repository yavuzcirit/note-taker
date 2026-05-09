import 'dotenv/config'
import http from 'http'
import { createApp } from './app'
import { createSocketServer } from './socket'
import { prisma } from './lib/prisma'
import { env } from './config/env'

async function main() {
  const app = createApp()
  const httpServer = http.createServer(app)
  createSocketServer(httpServer)

  await prisma.$connect()

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
