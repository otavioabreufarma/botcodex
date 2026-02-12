import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commandDefinitions } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('Defina DISCORD_TOKEN, DISCORD_CLIENT_ID e DISCORD_GUILD_ID no .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function run() {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commandDefinitions.map((command) => command.toJSON())
  });

  console.log('Slash commands registrados com sucesso.');
}

run().catch((error) => {
  console.error('Falha ao registrar comandos:', error);
  process.exit(1);
});
