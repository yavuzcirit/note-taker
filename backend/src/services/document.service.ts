import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'

export async function listDocuments(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: false },
    select: {
      id: true,
      title: true,
      icon: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
  })
}

export async function listTrashed(ownerId: string) {
  return prisma.document.findMany({
    where: { ownerId, isDeleted: true },
    select: { id: true, title: true, icon: true, deletedAt: true },
    orderBy: { deletedAt: 'desc' },
  })
}

export async function createDocument(ownerId: string) {
  const count = await prisma.document.count({ where: { ownerId, isDeleted: false } })
  return prisma.document.create({
    data: { ownerId, position: count },
    select: { id: true, title: true, icon: true, position: true, createdAt: true, updatedAt: true },
  })
}

export async function getDocument(id: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      icon: true,
      position: true,
      ownerId: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!doc) throw new AppError(404, 'Document not found')

  if (doc.ownerId !== userId) {
    const share = await prisma.shareLink.findFirst({
      where: {
        documentId: id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    if (!share) throw new AppError(403, 'Access denied')
  }

  return doc
}

export async function updateDocument(
  id: string,
  ownerId: string,
  data: Partial<{ title: string; content: unknown; icon: string | null; position: number }>,
) {
  await assertOwner(id, ownerId)
  return prisma.document.update({
    where: { id },
    data: data as Parameters<typeof prisma.document.update>[0]['data'],
    select: { id: true, title: true, icon: true, updatedAt: true },
  })
}

export async function softDelete(id: string, ownerId: string) {
  await assertOwner(id, ownerId)
  return prisma.document.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
    select: { id: true },
  })
}

export async function restoreDocument(id: string, ownerId: string) {
  await assertOwner(id, ownerId)
  return prisma.document.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
    select: { id: true, title: true },
  })
}

export async function permanentDelete(id: string, ownerId: string) {
  await assertOwner(id, ownerId)
  await prisma.document.delete({ where: { id } })
}

export async function assertOwner(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')
  if (doc.ownerId !== userId) throw new AppError(403, 'Access denied')
  return doc
}

export async function assertAccess(documentId: string, userId: string): Promise<'owner' | 'shared'> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')
  if (doc.ownerId === userId) return 'owner'

  const share = await prisma.shareLink.findFirst({
    where: {
      documentId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  if (!share) throw new AppError(403, 'Access denied')
  return 'shared'
}
