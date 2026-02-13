# Bot Discord para VIP

Bot em Node.js que conversa com o backend existente (sem alterar o backend), usando rotas de VIP, autenticação Steam e criação de checkout.

## Comandos

- `/vip-status steamid:<id>`
- `/vip-ativar steamid:<id> [discordid:<id>]`
- `/vip-remover steamid:<id>`
- `/vip-link-steam discordid:<id>`
- `/steam-vincular` (usa seu Discord ID e envia o link Steam por DM)
- `/pagamento-criar steamid:<id> [plan:<plano>]` (cria checkout, envia links por DM e monitora confirmação)

## Configuração

1. Entre na pasta do bot:

```bash
cd bot
```

2. Instale dependências:

```bash
npm install
```

3. Crie o `.env`:

```bash
cp .env.example .env
```

4. Preencha:

- `DISCORD_TOKEN`: token do bot.
- `DISCORD_CLIENT_ID`: application/client id do bot.
- `DISCORD_GUILD_ID`: id do servidor Discord (registro rápido de slash commands por guild).
- `BACKEND_BASE_URL`: URL base do backend (ex.: `https://meu-backend.discloud.app`).
- `BACKEND_API_KEY`: a mesma `API_KEY` do backend (necessária para rotas protegidas).

## Registrar comandos

```bash
npm run deploy:commands
```

## Rodar bot

```bash
npm start
```

## Observações

- O bot usa chamadas HTTP para o backend já existente.
- Fluxo novo de pagamento:
  - cria checkout (`/api/orders/checkout`),
  - manda DM de sincronização,
  - monitora `status` do VIP,
  - quando ativo, envia DM de pagamento confirmado.
- As respostas dos slash commands continuam `ephemeral` (visíveis só para quem executou o comando).
