import { Server as HttpServer } from 'http'
import { Server, Namespace } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { env } from './config/env'
import { socketAuthMiddleware } from './socket/middleware/socket-auth.middleware'
import { registerDocumentHandlers } from './socket/handlers/document.handler'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from './types/socket'

export type CollaborationNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    },
  )

  const collaboration = io.of('/collaboration') as CollaborationNamespace

  collaboration.use(socketAuthMiddleware)

  collaboration.on('connection', (socket) => {
    registerDocumentHandlers(collaboration, socket)
  })

  return io
}
