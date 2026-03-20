import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getQueue } from '../utils/queue';

export const data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel');

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const queue = getQueue(guildId);

    if (queue.connection) {
        queue.connection.destroy();
        queue.connection = null;
        queue.queue = [];
        queue.isPlaying = false;
        await interaction.reply({ content: "Left the voice channel and cleared queue!" });
    } else {
        await interaction.reply({ content: "I'm not in a voice channel.", ephemeral: true });
    }
}