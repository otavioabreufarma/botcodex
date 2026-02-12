import { fail } from '../utils/response.js';

export function apiAuth(req, res, next) {
  const authHeader = req.header('Authorization') ?? '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token || token !== process.env.API_KEY) {
    return res.status(401).json(fail('Não autorizado'));
  }

  return next();
}
