import { Router } from 'express';
import { apiAuth } from '../middlewares/apiAuth.js';
import { fail, ok } from '../utils/response.js';
import { getVipStatus, upsertVip } from '../services/vipService.js';

const router = Router();

// Rotas públicas (sem middleware)
router.post('/checkout', async (req, res) => {
  const { discordId, steamId, plan = 'vip-default' } = req.body;

  if (!discordId || !steamId) {
    return res.status(400).json(fail('discordId e steamId são obrigatórios'));
  }

  const checkoutUrl = `${process.env.PUBLIC_BASE_URL}/checkout/mock?steamId=${steamId}&plan=${plan}`;

  return res.json(
    ok({
      message: 'Checkout criado',
      checkoutUrl,
      metadata: { discordId, steamId, plan }
    })
  );
});

router.post('/webhook/infinitepay', async (req, res) => {
  const webhookSecret = req.header('x-infinitepay-secret');

  if (!webhookSecret || webhookSecret !== process.env.INFINITEPAY_WEBHOOK_SECRET) {
    return res.status(401).json(fail('Webhook secret inválido'));
  }

  const event = req.body;
  const paymentStatus = event?.status;
  const steamId = event?.metadata?.steamId;
  const discordId = event?.metadata?.discordId ?? null;

  if (paymentStatus !== 'confirmed' || !steamId) {
    return res.status(400).json(fail('Evento inválido para ativação VIP'));
  }

  const vip = await upsertVip({ steamId, discordId, source: 'infinitepay' });
  return res.json(ok({ message: 'Pagamento confirmado, VIP ativado', vip }));
});

// Demais rotas de /api/orders são protegidas
router.use(apiAuth);

router.get('/', async (req, res) => {
  const { steamId } = req.query;

  if (!steamId) {
    return res.status(400).json(fail('steamId é obrigatório'));
  }

  const vip = await getVipStatus(String(steamId));
  return res.json(ok({ vip }));
});

export default router;
