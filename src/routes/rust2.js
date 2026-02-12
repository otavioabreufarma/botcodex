import { Router } from 'express';
import { fail, ok } from '../utils/response.js';
import { deactivateVip, upsertVip } from '../services/vipService.js';

const router = Router();

router.post('/sync-vip', async (req, res) => {
  const rustServerKey = req.header('RUST_SERVER_KEY');

  if (!rustServerKey || rustServerKey !== process.env.RUST2_SERVER_KEY) {
    return res.status(401).json(fail('RUST_SERVER_KEY inválida para rust2'));
  }

  const { steamId, action = 'activate' } = req.body;
  if (!steamId) {
    return res.status(400).json(fail('steamId é obrigatório'));
  }

  const vip =
    action === 'remove'
      ? await deactivateVip({ steamId, source: 'rust2_sync' })
      : await upsertVip({ steamId, source: 'rust2_sync' });

  return res.json(
    ok({
      server: 'rust2',
      action,
      vip,
      pluginPayload: { steamId, action }
    })
  );
});

export default router;
