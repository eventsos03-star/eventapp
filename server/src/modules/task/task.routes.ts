import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as taskController from './task.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', taskController.listOrgTasks);
router.post('/', taskController.create);
router.patch('/:id/status', taskController.updateStatus);
router.delete('/:id', taskController.remove);

export default router;