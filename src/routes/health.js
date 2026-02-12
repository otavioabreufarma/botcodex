import { Router } from 'express';
import { ok } from '../utils/response.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok' }));
});

export default router;
