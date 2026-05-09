import { Router } from 'express'
import * as ctrl from '../controllers/document.controller'
import * as versionCtrl from '../controllers/version.controller'
import * as shareCtrl from '../controllers/share.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/trash', ctrl.trash)

router.get('/:id', ctrl.getOne)
router.patch('/:id', ctrl.update)
router.delete('/:id', ctrl.softDelete)
router.post('/:id/restore', ctrl.restore)
router.delete('/:id/permanent', ctrl.permanentDelete)
router.get('/:id/yjs-state', ctrl.getYjsState)

router.get('/:id/versions', versionCtrl.list)
router.get('/:id/versions/:vid', versionCtrl.getOne)
router.post('/:id/versions/:vid/restore', versionCtrl.restore)

router.post('/:id/share', shareCtrl.create)
router.get('/:id/share', shareCtrl.list)
router.delete('/:id/share/:lid', shareCtrl.revoke)

export default router
