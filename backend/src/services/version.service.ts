import * as Y from 'yjs'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import * as yjsService from './yjs.service'

export async function snapshot(documentId: string, createdById: string) {
  const room = yjsService.get(documentId)

  let yjsSnapshot: Uint8Array
  let title: string

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true, yjsState: true },
  })

  if (!doc) throw new AppError(404, 'Document not found')
  title = doc.title

  if (room) {
    yjsSnapshot = Y.encodeStateAsUpdate(room.ydoc)
  } else if (doc.yjsState) {
    yjsSnapshot = new Uint8Array(doc.yjsState)
  } else {
    yjsSnapshot = new Uint8Array()
  }

  const version = await prisma.version.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { documentId, yjsSnapshot: Buffer.from(yjsSnapshot) as any, title, createdById },
    select: {
      id: true,
      documentId: true,
      title: true,
      createdAt: true,
    },
  })

  const creator = await prisma.user.findUnique({
    where: { id: createdById },
    select: { id: true, name: true },
  })

  return { ...version, createdBy: creator ?? { id: createdById, name: 'Unknown' } }
}

export async function list(documentId: string) {
  return prisma.version.findMany({
    where: { documentId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getVersion(documentId: string, versionId: string) {
  const version = await prisma.version.findFirst({
    where: { id: versionId, documentId },
    select: {
      id: true,
      title: true,
      contentJson: true,
      yjsSnapshot: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  })
  if (!version) throw new AppError(404, 'Version not found')
  return version
}

export async function restore(documentId: string, versionId: string, restoredById: string) {
  await snapshot(documentId, restoredById)

  const version = await prisma.version.findFirst({
    where: { id: versionId, documentId },
    select: { yjsSnapshot: true, title: true },
  })
  if (!version) throw new AppError(404, 'Version not found')

  const freshYdoc = new Y.Doc()
  Y.applyUpdate(freshYdoc, new Uint8Array(version.yjsSnapshot), 'restore')
  const restoredState = Y.encodeStateAsUpdate(freshYdoc)
  const restoredBuffer = Buffer.from(restoredState)

  await prisma.document.update({
    where: { id: documentId },
    data: { yjsState: restoredBuffer, title: version.title },
  })

  const existingRoom = yjsService.get(documentId)
  if (existingRoom) {
    Y.applyUpdate(existingRoom.ydoc, restoredState, 'restore')
  }

  return { restoredState, title: version.title }
}
