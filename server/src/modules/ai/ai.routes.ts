import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { askDocs } from './ai.controller.js';
import { askSchema } from './ai.validator.js';

const router = Router();

router.post('/ask', validate(askSchema), askDocs);

export default router;