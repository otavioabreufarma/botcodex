import { Router } from 'express';
import { fail, ok } from '../utils/response.js';
import { upsertVip } from '../services/vipService.js';

const router = Router();

router.get('/steam/start', (req, res) => {
  const { discordId } = req.query;

  if (!discordId) {
    return res.status(400).json(fail('discordId é obrigatório'));
  }

  const returnTo = new URL('/api/auth/steam/callback', process.env.PUBLIC_BASE_URL);
  returnTo.searchParams.set('discordId', String(discordId));

  const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login');
  steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
  steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup');
  steamOpenIdUrl.searchParams.set('openid.return_to', returnTo.toString());
  steamOpenIdUrl.searchParams.set('openid.realm', process.env.PUBLIC_BASE_URL);
  steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
  steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');

  return res.json(ok({ redirectUrl: steamOpenIdUrl.toString() }));
});

router.get('/steam/callback', async (req, res) => {
  try {
    const claimedId = String(req.query['openid.claimed_id'] ?? '');
    const discordId = String(req.query.discordId ?? '');
    const steamId = claimedId.split('/').pop();

    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return res.status(400).json(fail('SteamID inválido no callback'));
    }

    const vip = await upsertVip({ steamId, discordId: discordId || null, source: 'steam_openid' });

    return res.json(ok({ message: 'Steam autenticada com sucesso', vip }));
  } catch (error) {
    return res.status(500).json(fail(error.message));
  }
});

export default router;
