import { Client, GatewayIntentBits, Message } from 'discord.js';
import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    NoSubscriberBehavior,
    entersState
} from '@discordjs/voice';
import dotenv from 'dotenv';
import translate from 'google-translate-api-x';
import { Readable } from 'stream';
import http from 'http'; // Add HTTP library
import fs from 'fs';
import path from 'path';

// Load environment variables from .env
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// A mapping of languages to native Murf Falcon Voice IDs (High Fidelity)
const VOICE_MAP: Record<string, string[]> = {
    // English (Native US/UK)
    "en": ["en-US-samantha", "en-US-marcus", "en-US-claire", "en-US-carter"],
    // Spanish (Native Spain/Mexico)
    "es": ["es-ES-carmen", "es-ES-enrique"],
    // French (Native France - Falcon currently only supports native males for French)
    "fr": ["fr-FR-axel", "fr-FR-guillaume"],     
    // German (Native Germany) 
    "de": ["de-DE-josephine", "de-DE-matthias"],
    // Hindi (Native India)
    "hi": ["hi-IN-shweta", "hi-IN-kabir"],
    // Japanese (Native Japan)
    "ja": ["ja-JP-kimi", "ja-JP-kenji"],
    // Italian (Native Italy)
    "it": ["it-IT-giulia", "it-IT-angelo"],      
    // Portuguese (Native Brazil)
    "pt": ["pt-BR-isadora", "pt-BR-benício", "pt-BR-heitor"],
    // Telugu (Native India) - Re-routed to English-IN voices as Telugu isn't officially supported in Falcon yet,
    // and it was breaking the bot previously.
    "te": ["en-IN-arohi", "en-IN-rohan"]
};

const DEFAULT_VOICE_ID = "en-US-samantha"; // Highly natural natively-spoken female voice

function getRandomVoice(langCode: string): string {
    const voices = VOICE_MAP[langCode];
    if (!voices || voices.length === 0) return "en-UK-hazel"; // Fallback
    return voices[Math.floor(Math.random() * voices.length)];
}

client.once('clientReady', () => {
    console.log(`🤖 Logged in as ${client.user?.tag}! HypeBot is ready.`);
});

// Create a global audio player for the bot
const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    },
});

let connection: any = null;

async function generateAndPlaySpeech(message: Message, text: string, voiceId: string) {
    try {
        console.log(`Generating TTS for: "${text}" with Voice: ${voiceId}`);
        
        const payload: any = {
            text: text,
            voiceId: voiceId,
            model: 'FALCON'
        };

        // Some voices support "Conversational", others support "Conversation", and some support neither.
        // If a style is passed that the voice doesn't support, the API will crash.
        // We handle the known voices accordingly.
        const voiceWithConversationStyle = ['fr-FR-axel', 'fr-FR-guillaume'];
        const voicesWithNoStyle = ['hi-IN-kabir', 'en-US-claire', 'hi-IN-rahul', 'hi-IN-amit'];

        if (voiceWithConversationStyle.includes(voiceId)) {
            payload.style = 'Conversation';
        } else if (!voicesWithNoStyle.includes(voiceId)) {
            payload.style = 'Conversational';
        }

        // Request audio stream from Murf Falcon
        const response = await fetch('https://global.api.murf.ai/v1/speech/stream', {
            method: 'POST',
            headers: {
                'api-key': MURF_API_KEY as string,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Murf API Error:", errorText);
            return message.reply("Failed to generate speech. Does this language have a valid voice?");
        }

        // Convert the arrayBuffer to a buffer suitable for @discordjs/voice
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Write the buffer to a temporary MP3 file to prevent ffmpeg streaming stutter/breakage
        const tempFilePath = path.join(process.cwd(), `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`);
        fs.writeFileSync(tempFilePath, buffer);

        // Create audio resource from file
        const resource = createAudioResource(tempFilePath);
        player.play(resource);

        // Clean up the temp file once the bot finishes playing it
        player.once(AudioPlayerStatus.Idle, () => {
            if (fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        });

        player.on('error', error => {
            console.error('Audio Player Error:', error);
            if (fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {}
            }
        });

    } catch (error) {
        console.error("Error with TTS:", error);
        message.reply("An error occurred while trying to process the TTS.");
    }
}


client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Command: !join
    if (message.content === '!join') {
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
            return message.reply("You need to be in a voice channel first!");
        }

        try {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
            });

            connection.subscribe(player);

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`Joined voice channel: ${voiceChannel.name}`);
                message.reply(`Joined <#${voiceChannel.id}>!
**Language Switcher Online** 🌍
Try these commands:
👉 \`!say Hello there\` (Default English)
👉 \`!translate es Let's practice some code together\` (Translates to Spanish)
👉 \`!translate hi Welcome to the hackathon project\` (Translates to Hindi)
👉 \`!translate fr Welcome to the team\` (Translates to French)
👉 \`!translate de Good morning everyone\` (Translates to German)
👉 \`!translate ja Tell me a story about coding\` (Translates to Japanese)
                `);
            });

        } catch (error) {
            console.error('Error joining voice channel:', error);
            message.reply("Failed to join the voice channel.");
        }
    }

    // Command: !leave
    if (message.content === '!leave') {
        if (connection) {
            connection.destroy();
            connection = null;
            message.reply("Left the voice channel!");
        } else {
            message.reply("I'm not in a voice channel.");
        }
    }

    // Command: !languages (Lists supported language codes)
    if (message.content === '!languages') {
        message.reply(`🌍 **Supported Language Codes:**
\`en\` - English 🇺🇸/🇬🇧
\`es\` - Spanish 🇪🇸/🇲🇽
\`fr\` - French 🇫🇷
\`de\` - German 🇩🇪
\`hi\` - Hindi 🇮🇳
\`ja\` - Japanese 🇯🇵
\`it\` - Italian 🇮🇹
\`pt\` - Portuguese 🇧🇷
\`te\` - Telugu 🇮🇳

*Example usage: \`!translate ja hello how are you\`*`);
    }

    // Command: !say <message>
    if (message.content.startsWith('!say ')) {
        if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
            return message.reply("I am not in a voice channel! Use `!join` first.");
        }

        const textToSpeak = message.content.slice(5).trim();
        if (!textToSpeak) return message.reply("Please provide some text!");

        message.react('🗣️');
        await generateAndPlaySpeech(message, textToSpeak, DEFAULT_VOICE_ID);
    }

    // Command: !translate <lang_code> <message>
    if (message.content.startsWith('!translate ')) {
        if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
            return message.reply("I am not in a voice channel! Use `!join` first.");
        }

        // Parse command: "!translate es Hello how are you doing today?"
        const args = message.content.split(' ');
        if (args.length < 3) {
            return message.reply("Usage: `!translate [language_code] [text]` (e.g. `!translate es Hello`)");
        }

        const targetLang = args[1].toLowerCase();
        const textToTranslate = args.slice(2).join(' ');

        message.react('🌍');

        try {
            // 1. Translate the text using public translation
            const translation = await translate(textToTranslate, { to: targetLang });
            const translatedText = translation.text;
            
            console.log(`Translated [${targetLang}]: ${translatedText}`);
            message.reply(`**Translated (${targetLang}):** ${translatedText}`);

            // 2. Map target language to a native Murf Voice
            // Default to UK voice if we don't have a specific mapped voice
            const voiceId = getRandomVoice(targetLang);

            // 3. Speak it in the voice channel
            await generateAndPlaySpeech(message, translatedText, voiceId);

        } catch (error) {
            console.error("Translation Error:", error);
            message.reply("Sorry, I could not translate that text!");
        }
    }

    // Command: !say-translate <lang_code> <message>
    if (message.content.startsWith('!say-translate ')) {
        if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
            return message.reply("I am not in a voice channel! Use `!join` first.");
        }

        const args = message.content.split(' ');
        if (args.length < 3) {
            return message.reply("Usage: `!say-translate [language_code] [text]` (e.g. `!say-translate es Hello`)");
        }

        const targetLang = args[1].toLowerCase();
        const textToSpeech = args.slice(2).join(' ');

        message.react('🔄');

        try {
            // 1. Speak original text
            message.reply(`**Original:** ${textToSpeech}`);
            await generateAndPlaySpeech(message, textToSpeech, DEFAULT_VOICE_ID);

            // Wait until the player is idle (meaning the first speech has finished) before moving on.
            // We wait up to 30 seconds for the first speech to complete.
            try {
                await entersState(player, AudioPlayerStatus.Idle, 30_000);
            } catch (err) {
                console.warn("First speech took too long or was interrupted.");
            }

            // 2. Fetch Translation
            const translation = await translate(textToSpeech, { to: targetLang });
            const translatedText = translation.text;
            
            console.log(`Translated [${targetLang}]: ${translatedText}`);
            message.reply(`**Translated (${targetLang}):** ${translatedText}`);

            // 3. Speak the Translation
            const voiceId = getRandomVoice(targetLang); 
            await generateAndPlaySpeech(message, translatedText, voiceId);
            
        } catch (error) {
            console.error("Translation/Speech Error:", error);
            message.reply("Sorry, I could not complete the operation!");
        }
    }
});

if (DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
} else {
    console.log("Waiting for Discord Token to start the bot...");
}
