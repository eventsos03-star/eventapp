import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as notificationController from './notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;
