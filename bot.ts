import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    NoSubscriberBehavior,
    VoiceConnection
} from '@discordjs/voice';
import dotenv from 'dotenv';
import translate from 'google-translate-api-x';
import http from 'http';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a dummy web server so Render.com's "Web Service" thinks we are a website
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HypeBot is alive and running!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌍 Dummy web server listening on port ${PORT}`);
});

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const MURF_API_KEY = process.env.MURF_FALCON_API_KEY;

if (!DISCORD_TOKEN) console.warn("⚠️ Warning: DISCORD_BOT_TOKEN is missing in .env");
if (!MURF_API_KEY) console.warn("⚠️ Warning: MURF_FALCON_API_KEY is missing in .env");

// We no longer need GuildMessages or MessageContent intents because we are using Slash Commands!
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const VOICE_MAP: Record<string, string[]> = {
    "en": ["en-US-samantha", "en-US-marcus", "en-US-claire", "en-US-carter"],
    "es": ["es-ES-carmen", "es-ES-enrique"],
    "fr": ["fr-FR-axel", "fr-FR-guillaume"],
    "de": ["de-DE-josephine", "de-DE-matthias"],
    "hi": ["hi-IN-shweta", "hi-IN-kabir"],
    "ja": ["ja-JP-kimi", "ja-JP-kenji"],
    "it": ["it-IT-giulia", "it-IT-angelo"],
    "pt": ["pt-BR-isadora", "pt-BR-benício", "pt-BR-heitor"],
    "te": ["en-IN-arohi", "en-IN-rohan"]
};

const DEFAULT_VOICE_ID = "en-US-samantha";

function getRandomVoice(langCode: string): string {
    const voices = VOICE_MAP[langCode];
    if (!voices || voices.length === 0) return "en-UK-hazel";
    return voices[Math.floor(Math.random() * voices.length)];
}

// ============== ENTERPRISE QUEUE SYSTEM ==============
interface QueueItem {
    interaction: ChatInputCommandInteraction;
    text: string;
    voiceId: string;
    description: string;
}

class GuildQueue {
    guildId: string;
    queue: QueueItem[] = [];
    player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    connection: VoiceConnection | null = null;
    isPlaying = false;

    constructor(guildId: string) {
        this.guildId = guildId;

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.isPlaying = false;
            this.processQueue(); // Automatically process next person in the queue
        });

        this.player.on('error', error => {
            console.error('Audio Player Error:', error);
            this.isPlaying = false;
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isPlaying || this.queue.length === 0 || !this.connection) return;
        this.isPlaying = true;

        const item = this.queue.shift();
        if (!item) return;

        try {
            console.log(`Generating TTS for: "${item.text}" with Voice: ${item.voiceId}`);

            const payload: any = {
                text: item.text,
                voiceId: item.voiceId,
                model: 'FALCON'
            };

            const voiceWithConversationStyle = ['fr-FR-axel', 'fr-FR-guillaume'];
            const voicesWithNoStyle = ['hi-IN-kabir', 'en-US-claire', 'hi-IN-rahul', 'hi-IN-amit'];

            if (voiceWithConversationStyle.includes(item.voiceId)) {
                payload.style = 'Conversation';
            } else if (!voicesWithNoStyle.includes(item.voiceId)) {
                payload.style = 'Conversational';
            }

            const response = await fetch('https://global.api.murf.ai/v1/speech/stream', {
                method: 'POST',
                headers: {
                    'api-key': MURF_API_KEY as string,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error("Murf API Error:", await response.text());
                await item.interaction.editReply({ content: `❌ Error: Language voice failed to stream.` });
                this.isPlaying = false;
                return this.processQueue();
            }

            const arrayBuffer = await response.arrayBuffer();
            const tempFilePath = path.join(process.cwd(), `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`);
            fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

            const resource = createAudioResource(tempFilePath);
            this.player.play(resource);
            
            this.player.once(AudioPlayerStatus.Idle, () => {
                if (fs.existsSync(tempFilePath)) {
                    try { fs.unlinkSync(tempFilePath); } catch(e){}
                }
            });

            if (item.description) {
                await item.interaction.editReply({ content: item.description });
            }

        } catch (error) {
            console.error("Error with TTS:", error);
            await item.interaction.editReply({ content: "❌ An error occurred processing the TTS." });
            this.isPlaying = false;
            this.processQueue();
        }
    }
}

const guildQueues = new Map<string, GuildQueue>();

function getQueue(guildId: string): GuildQueue {
    if (!guildQueues.has(guildId)) {
        guildQueues.set(guildId, new GuildQueue(guildId));
    }
    return guildQueues.get(guildId)!;
}

// ============== COMMAND REGISTRATION ==============
const commands = [
    new SlashCommandBuilder().setName('join').setDescription('Join your current voice channel'),
    new SlashCommandBuilder().setName('leave').setDescription('Leave the voice channel'),
    new SlashCommandBuilder().setName('languages').setDescription('Show supported languages'),
    new SlashCommandBuilder().setName('say').setDescription('Speak text in English')
        .addStringOption(opt => opt.setName('text').setDescription('Text to speak').setRequired(true)),
    new SlashCommandBuilder().setName('translate').setDescription('Translate and speak (Auto-detects language!)')
        .addStringOption(opt => opt.setName('language').setDescription('Target language code (e.g., es, fr, ja, hi)').setRequired(true))
        .addStringOption(opt => opt.setName('text').setDescription('Text to translate').setRequired(true)),
    new SlashCommandBuilder().setName('say-translate').setDescription('Speak original text, then translate and speak')
        .addStringOption(opt => opt.setName('language').setDescription('Target language code (e.g., es, fr, ja, hi)').setRequired(true))
        .addStringOption(opt => opt.setName('text').setDescription('Text to speak').setRequired(true)),
].map(c => c.toJSON());

client.once('clientReady', async () => {
    console.log(`🤖 Logged in as ${client.user?.tag}! Deploying slash commands...`);
    if (client.user && DISCORD_TOKEN) {
        const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('✅ Slash commands deployed globally!');
        } catch (error) {
            console.error('Error deploying commands:', error);
        }
    }
});

// ============== COMMAND HANDLING ==============
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const guildId = interaction.guildId;
    if (!guildId) return;

    const queue = getQueue(guildId);
    
    // Automatically join if trying to do a voice command
    const member = interaction.member as any;
    const channel = member?.voice?.channel;

    if (commandName === 'join') {
        if (!channel) return interaction.reply({ content: "You need to be in a voice channel first!", ephemeral: true });

        queue.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator as any,
        });

        queue.connection.subscribe(queue.player);
        await interaction.reply({ content: `✅ Joined <#${channel.id}>! Ready to speak.` });
    }

    else if (commandName === 'leave') {
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

    else if (commandName === 'languages') {
        await interaction.reply({ content: `🌍 **Supported Language Codes:**
\`en\` - English 🇺🇸/🇬🇧
\`es\` - Spanish 🇪🇸/🇲🇽
\`fr\` - French 🇫🇷
\`de\` - German 🇩🇪
\`hi\` - Hindi 🇮🇳
\`ja\` - Japanese 🇯🇵
\`it\` - Italian 🇮🇹
\`pt\` - Portuguese 🇧🇷
\`te\` - Telugu 🇮🇳`, ephemeral: true });
    }

    else if (commandName === 'say') {
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

    else if (commandName === 'translate') {
        if (!channel) return interaction.reply({ content: "You need to be in a voice channel!", ephemeral: true });
        if (!queue.connection || queue.connection.state.status !== VoiceConnectionStatus.Ready) {
            queue.connection = joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator as any });
            queue.connection.subscribe(queue.player);
        }
        
        await interaction.deferReply();
        const targetLang = interaction.options.getString('language', true).toLowerCase();
        const textToTranslate = interaction.options.getString('text', true);

        try {
            // Auto detection included in translation
            const translation = await translate(textToTranslate, { to: targetLang, from: 'auto' });
            const translatedText = translation.text;
            const detectedLang = translation.from?.language?.iso || 'unknown';

            queue.queue.push({
                interaction,
                text: translatedText,
                voiceId: getRandomVoice(targetLang),
                description: `🌍 **Language Detected:** \`${detectedLang}\`\n**Translated to (${targetLang}):** ${translatedText}`
            });
            queue.processQueue();
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Translation failed!");
        }
    }

    else if (commandName === 'say-translate') {
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
            
            // Map detected lang to a voice if not default English
            let detectedVoice = DEFAULT_VOICE_ID;
            if (detectedLang !== 'en') {
                 const fallbackVoice = getRandomVoice(detectedLang);
                 if (fallbackVoice !== "en-UK-hazel") detectedVoice = fallbackVoice;
            }

            // Push original text
            queue.queue.push({
                interaction,
                text: textToTranslate,
                voiceId: detectedVoice,
                description: `🗣️ **Original:** ${textToTranslate}`
            });

            // Push translated text directly after
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
});

if (DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
} else {
    console.log("Waiting for Discord Token to start the bot...");
}