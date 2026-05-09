import { Socket } from 'socket.io'
import * as Y from 'yjs'
import * as yjsService from '../../services/yjs.service'
import * as versionService from '../../services/version.service'
import * as documentService from '../../services/document.service'
import { prisma } from '../../lib/prisma'
import { SocketData, ServerToClientEvents, ClientToServerEvents, PresenceUser } from '../../types/socket'
import { CollaborationNamespace } from '../../socket'

function userColor(userId: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ]
  let hash = 0
  for (const char of userId) hash = char.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function roomKey(documentId: string): string {
  return `doc:${documentId}`
}

export function registerDocumentHandlers(
  io: CollaborationNamespace,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
): void {
  socket.on('doc:join', async ({ documentId }) => {
    try {
      await documentService.assertAccess(documentId, socket.data.userId)

      const room = await yjsService.getOrCreate(documentId)
      yjsService.incrementClients(documentId)

      await socket.join(roomKey(documentId))

      const yjsState = Buffer.from(Y.encodeStateAsUpdate(room.ydoc))

      socket.emit('doc:joined', {
        documentId,
        yjsState,
        awareness: Buffer.from(new Uint8Array()),
      })

      const presenceUser: PresenceUser = {
        userId: socket.data.userId,
        name: socket.data.name,
        avatarUrl: socket.data.avatarUrl,
        color: userColor(socket.data.userId),
      }

      const socketsInRoom = await io.in(roomKey(documentId)).fetchSockets()
      const users: PresenceUser[] = await Promise.all(
        socketsInRoom
          .filter((s) => s.id !== socket.id)
          .map(async (s) => {
            const data = s.data as SocketData
            return {
              userId: data.userId,
              name: data.name,
              avatarUrl: data.avatarUrl,
              color: userColor(data.userId),
            }
          }),
      )

      socket.emit('presence:list', { documentId, users })
      socket.to(roomKey(documentId)).emit('presence:joined', { documentId, user: presenceUser })

      socket.to(roomKey(documentId)).emit('activity:event', {
        documentId,
        event: {
          type: 'joined',
          userId: socket.data.userId,
          userName: socket.data.name,
          timestamp: new Date().toISOString(),
        },
      })

      if (room.versionTimer === null) {
        yjsService.setVersionTimer(documentId, () => {
          versionService.snapshot(documentId, socket.data.userId).catch(console.error)
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join document'
      socket.emit('error', { code: 'JOIN_FAILED', message })
    }
  })

  socket.on('doc:leave', ({ documentId }) => {
    socket.leave(roomKey(documentId))
    yjsService.decrementClients(documentId)
    socket.to(roomKey(documentId)).emit('presence:left', {
      documentId,
      userId: socket.data.userId,
    })
    socket.to(roomKey(documentId)).emit('activity:event', {
      documentId,
      event: {
        type: 'left',
        userId: socket.data.userId,
        userName: socket.data.name,
        timestamp: new Date().toISOString(),
      },
    })
  })

  socket.on('yjs:update', ({ documentId, update }) => {
    const updateArray = new Uint8Array(update as ArrayBuffer)
    yjsService.applyUpdate(documentId, updateArray)
    socket.to(roomKey(documentId)).emit('yjs:update', {
      documentId,
      update: Buffer.from(updateArray),
    })
    io.to(roomKey(documentId)).emit('activity:event', {
      documentId,
      event: {
        type: 'edited',
        userId: socket.data.userId,
        userName: socket.data.name,
        timestamp: new Date().toISOString(),
      },
    })
  })

  socket.on('awareness:update', ({ documentId, awarenessUpdate }) => {
    io.to(roomKey(documentId)).emit('awareness:update', {
      documentId,
      awarenessUpdate: Buffer.from(new Uint8Array(awarenessUpdate as ArrayBuffer)),
    })
  })

  socket.on('doc:title-update', async ({ documentId, title }) => {
    try {
      await documentService.assertOwner(documentId, socket.data.userId)
      await prisma.document.update({ where: { id: documentId }, data: { title } })
      socket.to(roomKey(documentId)).emit('doc:title-updated', { documentId, title })
      socket.to(roomKey(documentId)).emit('activity:event', {
        documentId,
        event: {
          type: 'title_changed',
          userId: socket.data.userId,
          userName: socket.data.name,
          timestamp: new Date().toISOString(),
          meta: { title },
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update title'
      socket.emit('error', { code: 'TITLE_UPDATE_FAILED', message })
    }
  })

  socket.on('version:create', async ({ documentId }) => {
    try {
      await documentService.assertAccess(documentId, socket.data.userId)
      const version = await versionService.snapshot(documentId, socket.data.userId)
      io.to(roomKey(documentId)).emit('version:created', {
        documentId,
        version: {
          id: version.id,
          documentId: version.documentId,
          title: version.title,
          createdAt: version.createdAt.toISOString(),
          createdBy: version.createdBy,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create version'
      socket.emit('error', { code: 'VERSION_FAILED', message })
    }
  })

  socket.on('disconnect', () => {
    for (const room of socket.rooms) {
      if (!room.startsWith('doc:')) continue
      const documentId = room.replace('doc:', '')
      yjsService.decrementClients(documentId)
      socket.to(room).emit('presence:left', { documentId, userId: socket.data.userId })
    }
  })
}
