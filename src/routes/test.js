import { Router } from 'express';
import { fail, ok } from '../utils/response.js';
import { rustEndpoints, sendVipToRustServer } from '../services/rustSyncService.js';
import { upsertVip } from '../services/vipService.js';

const router = Router();

router.post('/payment-confirmed', async (_req, res) => {
  try {
    const steamId = '76561198130758449';
    const vip = await upsertVip({ steamId, source: 'test_payment_confirmed' });

    const syncResults = await Promise.all(
      rustEndpoints().map((server) =>
        sendVipToRustServer({
          ...server,
          steamId,
          action: 'activate'
        })
      )
    );

    const reachedServers = syncResults.filter((item) => item.success).map((item) => item.server);

    return res.json(
      ok({
        message: 'Fluxo de pagamento confirmado simulado com sucesso',
        vipCreated: Boolean(vip),
        vip,
        vipSentToPlugin: reachedServers.length > 0,
        serversReached: reachedServers,
        syncResults
      })
    );
  } catch (error) {
    return res.status(500).json(fail(error.message));
  }
});

export default router;
