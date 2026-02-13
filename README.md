# VIP Backend (Node.js + Express) para Rust na Discloud

Backend modular para sistema VIP, com autenticação por API key, Steam OpenID, webhook da InfinitePay e sincronização com 2 servidores Rust.

## Estrutura

```txt
src/
  server.js
  app.js
  routes/
    auth.js
    orders.js
    vip.js
    rust1.js
    rust2.js
    health.js
    test.js
  middlewares/
    apiAuth.js
  services/
    rustSyncService.js
    vipService.js
  utils/
    db.js
    response.js
```

## Requisitos

- Node.js 18+
- Banco local em JSON (`data/db.json` por padrão)

## Configuração do `.env`

1. Copie o exemplo:

```bash
cp .env.example .env
```

2. Preencha as variáveis:

- `API_KEY`: chave usada em `Authorization: Bearer <API_KEY>` nas rotas protegidas.
- `JSON_DB_PATH` (opcional): caminho do arquivo JSON local (padrão `data/db.json`).
- `PUBLIC_BASE_URL`: URL pública HTTPS da Discloud.
- `INFINITEPAY_WEBHOOK_SECRET`: segredo do webhook da InfinitePay.
- `RUST1_SERVER_KEY` e `RUST2_SERVER_KEY`: chaves dos servidores Rust.

## Deploy na Discloud

O arquivo `discloud.config` já foi preparado:

```txt
NAME=vip-backend
TYPE=site
ID=meu-subdominio
MAIN=src/server.js
RAM=512
VERSION=latest
AUTORESTART=true
```

A aplicação sobe em `0.0.0.0:8080`, e o HTTPS é fornecido pela Discloud via proxy.

## Instalação e execução local

```bash
npm install
npm start
```

## Rotas

### Públicas (sem middleware)

- `GET /` → `API online`
- `GET /api/health`
- `GET /api/auth/steam/start?discordId=...`
- `GET /api/auth/steam/callback`
- `POST /api/orders/checkout`
- `POST /api/orders/webhook/infinitepay`

### Protegidas (`Authorization: Bearer <API_KEY>`)

- `/api/vip/*`
- `/api/orders` (exceto `checkout` e `webhook/infinitepay`)
- `/api/rust1/*`
- `/api/rust2/*`
- `/api/test/*`

## Steam OpenID

Fluxo básico:

1. Chame `GET /api/auth/steam/start?discordId=...`
2. Use `redirectUrl` retornado para enviar o usuário ao login Steam.
3. Após callback em `/api/auth/steam/callback`, o backend extrai o SteamID e grava/atualiza VIP.

## InfinitePay webhook

Endpoint: `POST /api/orders/webhook/infinitepay`

- Não exige `Authorization`.
- Exige header `x-infinitepay-secret` igual a `INFINITEPAY_WEBHOOK_SECRET`.
- Quando `status=confirmed`, ativa VIP no banco JSON usando `metadata.steamId`.

Exemplo de payload:

```json
{
  "status": "confirmed",
  "metadata": {
    "steamId": "76561198130758449",
    "discordId": "123456789"
  }
}
```

## Integração com 2 servidores Rust

Rotas:

- `POST /api/rust1/sync-vip`
- `POST /api/rust2/sync-vip`

Regras:

- Exigem `Authorization: Bearer <API_KEY>`.
- Exigem header `RUST_SERVER_KEY` correspondente ao servidor.
- Body: `{ "steamId": "...", "action": "activate|remove" }`

## Teste manual: pagamento confirmado

Rota protegida:

- `POST /api/test/payment-confirmed`

Comportamento:

- Simula pagamento confirmado.
- Usa SteamID fixo `76561198130758449`.
- Cria/atualiza VIP no banco.
- Dispara sincronização para:
  - `/api/rust1/sync-vip`
  - `/api/rust2/sync-vip`
- Retorna status consolidado dos servidores alcançados.

> Essa rota é para validação controlada e deve permanecer protegida por `API_KEY`.

## Padrão de resposta

Todas as rotas retornam:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

ou, em erro:

```json
{
  "success": false,
  "data": {},
  "error": "mensagem"
}
```

## Chamadas do bot Discord

Com `API_KEY`, o bot pode:

- Consultar VIP: `GET /api/vip/status/:steamId`
- Ativar manualmente: `POST /api/vip/activate`
- Gerar link Steam: `GET /api/vip/steam-link/:discordId`
