import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { getQueue, DEFAULT_VOICE_ID } from '../utils/queue';

export const data = new SlashCommandBuilder()
    .setName('say')
    .setDescription('Speak text in English')
    .addStringOption(opt => opt.setName('text').setDescription('Text to speak').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const queue = getQueue(guildId);
    const member = interaction.member as any;
    const channel = member?.voice?.channel;

    if (!channel) return interaction.reply({ content: "You need to be in a voice channel!", ephemeral: true });
    if (!queue.connection || queue.connection.state.status !== VoiceConnectionStatus.Ready) {
        queue.connection = joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator as any });
        queue.connection.subscribe(queue.player);
    }
    
    await interaction.deferReply();
    const text = interaction.options.getString('text', true);
    
    queue.queue.push({
        interaction,
        text,
        voiceId: DEFAULT_VOICE_ID,
        description: `🗣️ **Speaking:** ${text}`
    });
    queue.processQueue();
}