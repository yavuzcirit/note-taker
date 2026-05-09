import { Request, Response, NextFunction } from 'express'
import * as versionService from '../services/version.service'
import { assertAccess } from '../services/document.service'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params['id'] as string
    await assertAccess(id, req.user!.id)
    const versions = await versionService.list(id)
    res.json(versions)
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params['id'] as string
    const vid = req.params['vid'] as string
    await assertAccess(id, req.user!.id)
    const version = await versionService.getVersion(id, vid)
    res.json(version)
  } catch (err) {
    next(err)
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params['id'] as string
    const vid = req.params['vid'] as string
    await assertAccess(id, req.user!.id)
    const result = await versionService.restore(id, vid, req.user!.id)
    res.json({ message: 'Restored successfully', title: result.title })
  } catch (err) {
    next(err)
  }
}
