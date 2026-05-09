import { Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { verifyAccessToken } from '../../lib/jwt'
import { prisma } from '../../lib/prisma'
import { SocketData } from '../../types/socket'

export async function socketAuthMiddleware(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(';')
        .find((c: string) => c.trim().startsWith('access_token='))
        ?.split('=')[1]

    if (!token) {
      next(new Error('Authentication required'))
      return
    }

    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatarUrl: true },
    })

    if (!user) {
      next(new Error('User not found'))
      return
    }

    socket.data.userId = user.id
    socket.data.email = user.email
    socket.data.name = user.name
    socket.data.avatarUrl = user.avatarUrl

    next()
  } catch {
    next(new Error('Invalid token'))
  }
}
