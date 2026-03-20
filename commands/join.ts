import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { getQueue } from '../utils/queue';

export const data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your current voice channel');

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const queue = getQueue(guildId);
    const member = interaction.member as any;
    const channel = member?.voice?.channel;

    if (!channel) return interaction.reply({ content: "You need to be in a voice channel first!", ephemeral: true });

    queue.connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any,
    });

    queue.connection.subscribe(queue.player);
    await interaction.reply({ content: `✅ Joined <#${channel.id}>! Ready to speak.` });
}