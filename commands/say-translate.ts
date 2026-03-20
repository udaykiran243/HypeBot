import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import translate from 'google-translate-api-x';
import { getQueue, getRandomVoice, DEFAULT_VOICE_ID } from '../utils/queue';

export const data = new SlashCommandBuilder()
    .setName('say-translate')
    .setDescription('Speak original text, then translate and speak')
    .addStringOption(opt => opt.setName('language')
        .setDescription('Target language')
        .setRequired(true)
        .addChoices(
            { name: '🇪🇸 Spanish', value: 'es' },
            { name: '🇫🇷 French', value: 'fr' },
            { name: '🇩🇪 German', value: 'de' },
            { name: '🇮🇳 Hindi', value: 'hi' },
            { name: '🇯🇵 Japanese', value: 'ja' },
            { name: '🇮🇹 Italian', value: 'it' },
            { name: '🇧🇷 Portuguese', value: 'pt' },
            { name: '🇰🇷 Korean', value: 'ko' },
            { name: '🇨🇳 Chinese', value: 'zh' }
        )
    )
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
    const targetLang = interaction.options.getString('language', true).toLowerCase();
    const textToTranslate = interaction.options.getString('text', true);

    try {
        const translation = await translate(textToTranslate, { to: targetLang, from: 'auto' });
        const translatedText = translation.text;
        const detectedLang = translation.from?.language?.iso || 'unknown';
        
        let detectedVoice = DEFAULT_VOICE_ID;
        if (detectedLang !== 'en') {
             const fallbackVoice = getRandomVoice(detectedLang);
             if (fallbackVoice !== "en-UK-hazel") detectedVoice = fallbackVoice;
        }

        queue.queue.push({
            interaction,
            text: textToTranslate,
            voiceId: detectedVoice,
            description: `🗣️ **Original:** ${textToTranslate}`
        });

        queue.queue.push({
            interaction,
            text: translatedText,
            voiceId: getRandomVoice(targetLang),
            description: `🗣️ **Original:** ${textToTranslate}\n🌍 **Translated (${targetLang}):** ${translatedText}`
        });

        queue.processQueue();
    } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Translation failed!");
    }
}