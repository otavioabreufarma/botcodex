import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import ordersRoutes from './routes/orders.js';
import rust1Routes from './routes/rust1.js';
import rust2Routes from './routes/rust2.js';
import testRoutes from './routes/test.js';
import vipRoutes from './routes/vip.js';
import { apiAuth } from './middlewares/apiAuth.js';
import { fail } from './utils/response.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

app.get('/', (_req, res) => {
  res.send('API online');
});

app.use('/api', healthRoutes);

// Rotas públicas sem middleware
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);

// Rotas protegidas por API_KEY
app.use('/api/vip', apiAuth, vipRoutes);
app.use('/api/rust1', apiAuth, rust1Routes);
app.use('/api/rust2', apiAuth, rust2Routes);
app.use('/api/test', apiAuth, testRoutes);

app.use((_req, res) => {
  res.status(404).json(fail('Rota não encontrada'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json(fail('Erro interno do servidor'));
});

export default app;
