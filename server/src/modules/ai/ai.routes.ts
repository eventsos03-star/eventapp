import { Router } from 'express';
import { aiLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import * as aiController from './ai.controller.js';
import { askSchema } from './ai.validator.js';

const router = Router();

router.post('/ask', aiLimiter, validate(askSchema), aiController.ask);

export default router;