import { Router } from 'express';
import { fail, ok } from '../utils/response.js';
import { deactivateVip, getVipStatus, upsertVip } from '../services/vipService.js';

const router = Router();

router.get('/status/:steamId', async (req, res) => {
  const vip = await getVipStatus(req.params.steamId);
  return res.json(ok({ vip }));
});

router.post('/activate', async (req, res) => {
  const { steamId, discordId } = req.body;

  if (!steamId) {
    return res.status(400).json(fail('steamId é obrigatório'));
  }

  const vip = await upsertVip({ steamId, discordId, source: 'manual' });
  return res.json(ok({ message: 'VIP ativado manualmente', vip }));
});

router.post('/deactivate', async (req, res) => {
  const { steamId } = req.body;

  if (!steamId) {
    return res.status(400).json(fail('steamId é obrigatório'));
  }

  const vip = await deactivateVip({ steamId, source: 'manual' });
  if (!vip) {
    return res.status(404).json(fail('VIP não encontrado'));
  }

  return res.json(ok({ message: 'VIP removido', vip }));
});

router.get('/steam-link/:discordId', (req, res) => {
  const { discordId } = req.params;
  const link = `${process.env.PUBLIC_BASE_URL}/api/auth/steam/start?discordId=${encodeURIComponent(discordId)}`;
  return res.json(ok({ discordId, link }));
});

export default router;
