import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import { initDatabase } from './utils/db.js';

const PORT = 8080;
const HOST = '0.0.0.0';

async function bootstrap() {
  await initDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    console.log('Ambiente pronto para Discloud (HTTPS por proxy da plataforma).');
  });
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar a aplicação:', error);
  process.exit(1);
});
