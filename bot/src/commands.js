import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import {
  activateVip,
  createCheckout,
  deactivateVip,
  getSteamAuthUrl,
  getSteamLink,
  getVipStatus
} from './backendClient.js';

const paymentWatchers = new Map();
const POLL_INTERVAL_MS = 30_000;
const MAX_POLL_ATTEMPTS = 20;

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
    ),
  new SlashCommandBuilder()
    .setName('steam-vincular')
    .setDescription('Inicia seu vínculo com Steam e envia o link por DM'),
  new SlashCommandBuilder()
    .setName('pagamento-criar')
    .setDescription('Cria checkout no backend e envia os links por DM')
    .addStringOption((option) =>
      option.setName('steamid').setDescription('SteamID64 (17 dígitos)').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('plan')
        .setDescription('Plano a comprar (padrão: vip-default)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('vip-painel')
    .setDescription('Abre um painel com botões para vincular Steam e comprar VIP')
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

async function sendDm(user, message) {
  try {
    await user.send(message);
    return true;
  } catch (error) {
    console.warn(`Não foi possível enviar DM para ${user.id}: ${error.message}`);
    return false;
  }
}

function watchPaymentConfirmation({ steamId, user }) {
  const key = `${user.id}:${steamId}`;

  if (paymentWatchers.has(key)) {
    clearInterval(paymentWatchers.get(key));
  }

  let attempts = 0;
  const intervalId = setInterval(async () => {
    attempts += 1;

    try {
      const { vip } = await getVipStatus(steamId);
      const isActive = Boolean(vip && (vip.is_active ?? vip.isActive));

      if (isActive) {
        await sendDm(
          user,
          [
            '✅ Pagamento confirmado no backend.',
            'Seu VIP já está ativo e a sincronização foi disparada.',
            `SteamID: ${steamId}`
          ].join('\n')
        );

        clearInterval(intervalId);
        paymentWatchers.delete(key);
        return;
      }
    } catch (error) {
      console.warn(`Erro ao monitorar pagamento (${steamId}): ${error.message}`);
    }

    if (attempts >= MAX_POLL_ATTEMPTS) {
      clearInterval(intervalId);
      paymentWatchers.delete(key);
      await sendDm(
        user,
        [
          '⚠️ Ainda não recebemos confirmação de pagamento no backend.',
          'Se você já pagou, aguarde alguns minutos e use /vip-status para conferir.',
          `SteamID: ${steamId}`
        ].join('\n')
      );
    }
  }, POLL_INTERVAL_MS);

  paymentWatchers.set(key, intervalId);
}

function buildStatusEmbed(vip, steamId) {
  const isActive = Boolean(vip && (vip.is_active ?? vip.isActive));

  return new EmbedBuilder()
    .setTitle('Status do VIP')
    .setColor(isActive ? 0x57f287 : 0xed4245)
    .setDescription(formatVip(vip))
    .addFields({ name: 'SteamID consultado', value: steamId })
    .setTimestamp();
}

function buildCheckoutEmbed({ plan, steamId }) {
  return new EmbedBuilder()
    .setTitle('Checkout VIP criado')
    .setColor(0x5865f2)
    .setDescription('Use os botões abaixo para concluir o pagamento e vincular sua Steam.')
    .addFields(
      { name: 'Plano', value: plan, inline: true },
      { name: 'SteamID', value: steamId, inline: true },
      { name: 'Sincronização', value: 'Você receberá DM quando o pagamento for confirmado.' }
    )
    .setTimestamp()
    .setFooter({ text: 'Integração em tempo real com o backend' });
}

function buildVipPanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vip:link_steam')
        .setLabel('Vincular Steam')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('vip:buy')
        .setLabel('Comprar VIP')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('vip:status')
        .setLabel('Consultar status')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildLinkRow({ checkoutUrl, steamAuthUrl }) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Abrir checkout').setStyle(ButtonStyle.Link).setURL(checkoutUrl),
      new ButtonBuilder()
        .setLabel('Vincular Steam')
        .setStyle(ButtonStyle.Link)
        .setURL(steamAuthUrl)
    )
  ];
}

function buildSteamIdModal({ customId, title, includePlan = false }) {
  const steamInput = new TextInputBuilder()
    .setCustomId('steamid')
    .setLabel('SteamID64 (17 dígitos)')
    .setStyle(TextInputStyle.Short)
    .setMinLength(17)
    .setMaxLength(17)
    .setRequired(true)
    .setPlaceholder('7656119...');

  const rows = [new ActionRowBuilder().addComponents(steamInput)];

  if (includePlan) {
    const planInput = new TextInputBuilder()
      .setCustomId('plan')
      .setLabel('Plano')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('vip-default');

    rows.push(new ActionRowBuilder().addComponents(planInput));
  }

  return new ModalBuilder().setCustomId(customId).setTitle(title).addComponents(rows);
}

async function handleVipPanelButton(interaction) {
  switch (interaction.customId) {
    case 'vip:link_steam': {
      await interaction.deferReply({ ephemeral: true });
      const { redirectUrl } = await getSteamAuthUrl(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle('Vincular conta Steam')
        .setDescription('Clique no botão abaixo para iniciar o vínculo da sua Steam com o backend.')
        .setColor(0x5865f2);

      await interaction.editReply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel('Abrir vínculo Steam')
              .setURL(redirectUrl)
          )
        ]
      });
      return;
    }
    case 'vip:buy': {
      const modal = buildSteamIdModal({
        customId: 'vip:buy_modal',
        title: 'Comprar VIP',
        includePlan: true
      });
      await interaction.showModal(modal);
      return;
    }
    case 'vip:status': {
      const modal = buildSteamIdModal({ customId: 'vip:status_modal', title: 'Consultar status VIP' });
      await interaction.showModal(modal);
      return;
    }
    default:
      return;
  }
}

async function handleVipModal(interaction) {
  if (interaction.customId === 'vip:status_modal') {
    await interaction.deferReply({ ephemeral: true });
    const steamId = interaction.fields.getTextInputValue('steamid');
    const { vip } = await getVipStatus(steamId);
    await interaction.editReply({ embeds: [buildStatusEmbed(vip, steamId)] });
    return;
  }

  if (interaction.customId === 'vip:buy_modal') {
    await interaction.deferReply({ ephemeral: true });
    const steamId = interaction.fields.getTextInputValue('steamid');
    const plan = interaction.fields.getTextInputValue('plan') || 'vip-default';

    const [checkout, steamAuth] = await Promise.all([
      createCheckout({ discordId: interaction.user.id, steamId, plan }),
      getSteamAuthUrl(interaction.user.id)
    ]);

    watchPaymentConfirmation({ steamId, user: interaction.user });

    await interaction.editReply({
      embeds: [
        buildCheckoutEmbed({
          plan,
          steamId
        })
      ],
      components: buildLinkRow({ checkoutUrl: checkout.checkoutUrl, steamAuthUrl: steamAuth.redirectUrl })
    });

    await sendDm(
      interaction.user,
      [
        '🧾 Seu checkout foi criado.',
        `Plano: ${plan}`,
        `SteamID: ${steamId}`,
        `Checkout: ${checkout.checkoutUrl}`,
        `Vincular Steam: ${steamAuth.redirectUrl}`
      ].join('\n')
    );
  }
}

export async function handleInteraction(interaction) {
  if (interaction.isButton()) {
    await handleVipPanelButton(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    await handleVipModal(interaction);
    return;
  }

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
      case 'steam-vincular': {
        await interaction.deferReply({ ephemeral: true });
        const { redirectUrl } = await getSteamAuthUrl(interaction.user.id);
        const dmSent = await sendDm(
          interaction.user,
          [
            '🔗 Vamos vincular sua Steam com o backend.',
            '1) Clique no link abaixo',
            '2) Faça login na Steam',
            '3) Volte e use /vip-status com seu SteamID para confirmar',
            '',
            redirectUrl
          ].join('\n')
        );

        if (!dmSent) {
          await interaction.editReply(
            `Não consegui te enviar DM. Use este link direto: ${redirectUrl}`
          );
          return;
        }

        await interaction.editReply('Te enviei no DM o link para vincular a Steam.');
        return;
      }
      case 'pagamento-criar': {
        await interaction.deferReply({ ephemeral: true });
        const steamId = interaction.options.getString('steamid', true);
        const plan = interaction.options.getString('plan', false) ?? 'vip-default';

        const [checkout, steamAuth] = await Promise.all([
          createCheckout({ discordId: interaction.user.id, steamId, plan }),
          getSteamAuthUrl(interaction.user.id)
        ]);

        const dmSent = await sendDm(
          interaction.user,
          [
            '🧾 Checkout criado com sucesso no backend.',
            `Plano: ${plan}`,
            `SteamID: ${steamId}`,
            '',
            `Checkout: ${checkout.checkoutUrl}`,
            `Vincular Steam: ${steamAuth.redirectUrl}`,
            '',
            '🔄 Iniciamos a sincronização do status do pagamento. Você receberá DM de confirmação.'
          ].join('\n')
        );

        watchPaymentConfirmation({ steamId, user: interaction.user });

        const reply = dmSent
          ? 'Checkout criado! Te enviei os links por DM e vou te avisar quando o pagamento for confirmado.'
          : [
              'Checkout criado, mas não consegui te enviar DM.',
              `Checkout: ${checkout.checkoutUrl}`,
              `Vincular Steam: ${steamAuth.redirectUrl}`
            ].join('\n');

        await interaction.editReply(reply);
        return;
      }
      case 'vip-painel': {
        const embed = new EmbedBuilder()
          .setTitle('Painel VIP')
          .setDescription(
            [
              'Use os botões para interagir com o backend de forma rápida:',
              '• Vincular sua Steam',
              '• Comprar VIP',
              '• Consultar status do VIP'
            ].join('\n')
          )
          .setColor(0x5865f2)
          .setFooter({ text: 'Fluxo responsivo para desktop e mobile no Discord' });

        await interaction.reply({
          ephemeral: true,
          embeds: [embed],
          components: buildVipPanelComponents()
        });
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
