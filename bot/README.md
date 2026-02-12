# Bot Discord para VIP

Bot em Node.js que conversa com o backend existente (sem alterar o backend), usando as rotas protegidas de VIP.

## Comandos

- `/vip-status steamid:<id>`
- `/vip-ativar steamid:<id> [discordid:<id>]`
- `/vip-remover steamid:<id>`
- `/vip-link-steam discordid:<id>`

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
- `BACKEND_API_KEY`: a mesma `API_KEY` do backend.

## Registrar comandos

```bash
npm run deploy:commands
```

## Rodar bot

```bash
npm start
```

## Observações

- O bot usa somente chamadas HTTP para o backend já existente.
- Não precisa alterar nenhuma rota do backend.
- As respostas são `ephemeral` (visíveis só para quem executou o comando).
