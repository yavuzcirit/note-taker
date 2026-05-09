import { Router } from 'express'
import { resolve } from '../controllers/share.controller'

const router = Router()

router.get('/:token', resolve)

export default router
