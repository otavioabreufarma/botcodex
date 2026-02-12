import { SlashCommandBuilder } from 'discord.js';
import { activateVip, deactivateVip, getSteamLink, getVipStatus } from './backendClient.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('vip-status')
    .setDescription('Consulta o status de VIP por SteamID')
    .addStringOption((option) =>
      option.setName('steamid').setDescription('SteamID64 (17 dígitos)').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('vip-ativar')
    .setDescription('Ativa VIP manualmente para um SteamID')
    .addStringOption((option) =>
      option.setName('steamid').setDescription('SteamID64 (17 dígitos)').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('discordid')
        .setDescription('Discord ID do jogador (opcional)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('vip-remover')
    .setDescription('Remove VIP manualmente por SteamID')
    .addStringOption((option) =>
      option.setName('steamid').setDescription('SteamID64 (17 dígitos)').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('vip-link-steam')
    .setDescription('Gera link de vínculo Steam para o Discord ID informado')
    .addStringOption((option) =>
      option
        .setName('discordid')
        .setDescription('Discord ID para gerar o link de vinculação')
        .setRequired(true)
    )
];

function formatVip(vip) {
  if (!vip) {
    return 'VIP não encontrado para o SteamID informado.';
  }

  return [
    `SteamID: ${vip.steam_id ?? vip.steamId ?? 'n/d'}`,
    `DiscordID: ${vip.discord_id ?? vip.discordId ?? 'n/d'}`,
    `Ativo: ${vip.is_active ?? vip.isActive ? 'sim' : 'não'}`,
    `Fonte: ${vip.source ?? 'n/d'}`,
    `Expira em: ${vip.expires_at ?? vip.expiresAt ?? 'n/d'}`
  ].join('\n');
}

export async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    switch (interaction.commandName) {
      case 'vip-status': {
        await interaction.deferReply({ ephemeral: true });
        const steamId = interaction.options.getString('steamid', true);
        const { vip } = await getVipStatus(steamId);
        await interaction.editReply(formatVip(vip));
        return;
      }
      case 'vip-ativar': {
        await interaction.deferReply({ ephemeral: true });
        const steamId = interaction.options.getString('steamid', true);
        const discordId = interaction.options.getString('discordid', false) ?? undefined;
        const { message, vip } = await activateVip({ steamId, discordId });
        await interaction.editReply(`${message}\n\n${formatVip(vip)}`);
        return;
      }
      case 'vip-remover': {
        await interaction.deferReply({ ephemeral: true });
        const steamId = interaction.options.getString('steamid', true);
        const { message, vip } = await deactivateVip({ steamId });
        await interaction.editReply(`${message}\n\n${formatVip(vip)}`);
        return;
      }
      case 'vip-link-steam': {
        await interaction.deferReply({ ephemeral: true });
        const discordId = interaction.options.getString('discordid', true);
        const { link } = await getSteamLink(discordId);
        await interaction.editReply(`Use este link para vincular Steam: ${link}`);
        return;
      }
      default:
        return;
    }
  } catch (error) {
    const message = `Erro ao falar com o backend: ${error.message}`;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
      return;
    }

    await interaction.reply({ content: message, ephemeral: true });
  }
}
