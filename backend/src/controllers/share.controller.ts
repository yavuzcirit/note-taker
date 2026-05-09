import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Permission } from '@prisma/client'
import * as shareService from '../services/share.service'

const createSchema = z.object({
  permission: z.nativeEnum(Permission).default(Permission.READ),
  expiresAt: z.string().datetime().optional().transform((v) => (v ? new Date(v) : undefined)),
})

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { permission, expiresAt } = createSchema.parse(req.body)
    const link = await shareService.createShareLink(
      req.params['id'] as string,
      req.user!.id,
      permission,
      expiresAt,
    )
    res.status(201).json(link)
  } catch (err) {
    next(err)
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const links = await shareService.listShareLinks(req.params['id'] as string, req.user!.id)
    res.json(links)
  } catch (err) {
    next(err)
  }
}

export async function revoke(req: Request, res: Response, next: NextFunction) {
  try {
    await shareService.revokeShareLink(req.params['lid'] as string, req.user!.id)
    res.json({ message: 'Share link revoked' })
  } catch (err) {
    next(err)
  }
}

export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await shareService.resolveToken(req.params['token'] as string)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
