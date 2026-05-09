import { Router } from 'express'
import authRoutes from './auth.routes'
import documentRoutes from './document.routes'
import shareRoutes from './share.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/documents', documentRoutes)
router.use('/share', shareRoutes)

export default router
