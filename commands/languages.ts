import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('languages')
    .setDescription('Show supported languages');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: `🌍 **Supported Language Codes:**
\`en\` - English 🇺🇸/🇬🇧
\`es\` - Spanish 🇪🇸/🇲🇽
\`fr\` - French 🇫🇷
\`de\` - German 🇩🇪
\`hi\` - Hindi 🇮🇳
\`ja\` - Japanese 🇯🇵
\`it\` - Italian 🇮🇹
\`pt\` - Portuguese 🇧🇷
\`ko\` - Korean 🇰🇷
\`zh-CN\` - Chinese 🇨🇳\`, ephemeral: true });
}