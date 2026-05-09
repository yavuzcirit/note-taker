import * as Y from 'yjs'
import { prisma } from '../lib/prisma'

interface DocRoom {
  ydoc: Y.Doc
  awareness: Map<number, unknown>
  persistTimer: ReturnType<typeof setTimeout> | null
  versionTimer: ReturnType<typeof setInterval> | null
  clientCount: number
}

const rooms = new Map<string, DocRoom>()

export async function getOrCreate(documentId: string): Promise<DocRoom> {
  if (rooms.has(documentId)) {
    return rooms.get(documentId)!
  }

  const ydoc = new Y.Doc()
  const room: DocRoom = {
    ydoc,
    awareness: new Map(),
    persistTimer: null,
    versionTimer: null,
    clientCount: 0,
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { yjsState: true },
  })

  if (doc?.yjsState) {
    Y.applyUpdate(ydoc, new Uint8Array(doc.yjsState), 'load')
  }

  rooms.set(documentId, room)
  return room
}

export function get(documentId: string): DocRoom | undefined {
  return rooms.get(documentId)
}

export function applyUpdate(documentId: string, update: Uint8Array): void {
  const room = rooms.get(documentId)
  if (!room) return
  Y.applyUpdate(room.ydoc, update, 'remote')
  schedulePersist(documentId, room)
}

export function getStateUpdate(documentId: string): Uint8Array {
  const room = rooms.get(documentId)
  if (!room) return new Uint8Array()
  return Y.encodeStateAsUpdate(room.ydoc)
}

export function incrementClients(documentId: string): void {
  const room = rooms.get(documentId)
  if (room) room.clientCount++
}

export function decrementClients(documentId: string): void {
  const room = rooms.get(documentId)
  if (!room) return
  room.clientCount = Math.max(0, room.clientCount - 1)

  if (room.clientCount === 0) {
    flushAndCleanup(documentId, room)
  }
}

function schedulePersist(documentId: string, room: DocRoom): void {
  if (room.persistTimer) clearTimeout(room.persistTimer)
  room.persistTimer = setTimeout(() => persistToDb(documentId, room), 2000)
}

async function persistToDb(documentId: string, room: DocRoom): Promise<void> {
  const state = Y.encodeStateAsUpdate(room.ydoc)
  await prisma.document
    .update({
      where: { id: documentId },
      data: { yjsState: Buffer.from(state), updatedAt: new Date() },
    })
    .catch(console.error)
}

async function flushAndCleanup(documentId: string, room: DocRoom): Promise<void> {
  if (room.persistTimer) clearTimeout(room.persistTimer)
  if (room.versionTimer) clearInterval(room.versionTimer)
  await persistToDb(documentId, room)
  rooms.delete(documentId)
}

export function setVersionTimer(
  documentId: string,
  callback: () => void,
  intervalMs = 30 * 60 * 1000,
): void {
  const room = rooms.get(documentId)
  if (!room) return
  if (room.versionTimer) clearInterval(room.versionTimer)
  room.versionTimer = setInterval(callback, intervalMs)
}

export function clearVersionTimer(documentId: string): void {
  const room = rooms.get(documentId)
  if (!room) return
  if (room.versionTimer) clearInterval(room.versionTimer)
  room.versionTimer = null
}
