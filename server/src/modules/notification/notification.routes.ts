import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as notificationController from './notification.controller.js';
import {
  listNotificationsSchema,
  notificationIdParamSchema,
} from './notification.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsSchema), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.post('/socket-ticket', notificationController.issueSocketTicket);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markRead);
router.delete('/', notificationController.clearAll);
router.delete('/:id', validate(notificationIdParamSchema), notificationController.remove);

export default router;