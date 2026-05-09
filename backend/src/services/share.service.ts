import { Permission } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'

export async function createShareLink(
  documentId: string,
  createdById: string,
  permission: Permission = Permission.READ,
  expiresAt?: Date,
) {
  await assertOwner(documentId, createdById)
  return prisma.shareLink.create({
    data: { documentId, createdById, permission, expiresAt },
    select: { id: true, token: true, permission: true, expiresAt: true, createdAt: true },
  })
}

export async function listShareLinks(documentId: string, ownerId: string) {
  await assertOwner(documentId, ownerId)
  return prisma.shareLink.findMany({
    where: { documentId },
    select: { id: true, token: true, permission: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function revokeShareLink(linkId: string, ownerId: string) {
  const link = await prisma.shareLink.findUnique({
    where: { id: linkId },
    select: { document: { select: { ownerId: true } } },
  })
  if (!link) throw new AppError(404, 'Share link not found')
  if (link.document.ownerId !== ownerId) throw new AppError(403, 'Access denied')
  await prisma.shareLink.delete({ where: { id: linkId } })
}

export async function resolveToken(token: string) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      id: true,
      permission: true,
      expiresAt: true,
      document: {
        select: {
          id: true,
          title: true,
          content: true,
          icon: true,
          isDeleted: true,
          owner: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!link) throw new AppError(404, 'Share link not found')
  if (link.expiresAt && link.expiresAt < new Date()) throw new AppError(410, 'Share link expired')
  if (link.document.isDeleted) throw new AppError(404, 'Document not found')

  return { permission: link.permission, document: link.document }
}

async function assertOwner(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  })
  if (!doc) throw new AppError(404, 'Document not found')
  if (doc.ownerId !== userId) throw new AppError(403, 'Access denied')
}
