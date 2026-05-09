import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as documentService from '../services/document.service'
import * as yjsService from '../services/yjs.service'

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  icon: z.string().max(10).nullable().optional(),
  content: z.unknown().optional(),
  position: z.number().int().min(0).optional(),
})

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const docs = await documentService.listDocuments(req.user!.id)
    res.json(docs)
  } catch (err) {
    next(err)
  }
}

export async function trash(req: Request, res: Response, next: NextFunction) {
  try {
    const docs = await documentService.listTrashed(req.user!.id)
    res.json(docs)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await documentService.createDocument(req.user!.id)
    res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await documentService.getDocument(req.params['id'] as string, req.user!.id)
    res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body)
    const doc = await documentService.updateDocument(req.params['id'] as string, req.user!.id, data)
    res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function softDelete(req: Request, res: Response, next: NextFunction) {
  try {
    await documentService.softDelete(req.params['id'] as string, req.user!.id)
    res.json({ message: 'Document moved to trash' })
  } catch (err) {
    next(err)
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await documentService.restoreDocument(req.params['id'] as string, req.user!.id)
    res.json(doc)
  } catch (err) {
    next(err)
  }
}

export async function permanentDelete(req: Request, res: Response, next: NextFunction) {
  try {
    await documentService.permanentDelete(req.params['id'] as string, req.user!.id)
    res.json({ message: 'Document permanently deleted' })
  } catch (err) {
    next(err)
  }
}

export async function getYjsState(req: Request, res: Response, next: NextFunction) {
  try {
    await documentService.assertAccess(req.params['id'] as string, req.user!.id)
    const state = yjsService.getStateUpdate(req.params['id'] as string)
    res.set('Content-Type', 'application/octet-stream')
    res.send(Buffer.from(state))
  } catch (err) {
    next(err)
  }
}
