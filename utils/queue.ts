import { ChatInputCommandInteraction } from 'discord.js';
import { 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    NoSubscriberBehavior,
    VoiceConnection
} from '@discordjs/voice';
import { Readable } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

const MURF_API_KEY = process.env.MURF_FALCON_API_KEY;

export const VOICE_MAP: Record<string, string[]> = {
    "en": ["en-US-samantha", "en-US-marcus", "en-US-claire", "en-US-carter"],
    "es": ["es-ES-carmen", "es-ES-enrique"],
    "fr": ["fr-FR-axel", "fr-FR-guillaume"],
    "de": ["de-DE-josephine", "de-DE-matthias"],
    "hi": ["hi-IN-karan", "hi-IN-namrita", "hi-IN-sunaina"],
    "ja": ["ja-JP-kimi", "ja-JP-kenji"],
    "it": ["it-IT-giulia", "it-IT-angelo"],
    "pt": ["pt-BR-isadora", "pt-BR-heitor"],
    "ko": ["ko-KR-jangmi", "ko-KR-sanghoon"],
    "zh": ["zh-CN-baolin", "zh-CN-wei"]
};

export const DEFAULT_VOICE_ID = "en-US-samantha";

export function getRandomVoice(langCode: string): string {
    const voices = VOICE_MAP[langCode];
    if (!voices || voices.length === 0) return "en-UK-hazel";
    return voices[Math.floor(Math.random() * voices.length)];
}

export interface QueueItem {
    interaction: ChatInputCommandInteraction;
    text: string;
    voiceId: string;
    description: string;
}

export class GuildQueue {
    guildId: string;
    queue: QueueItem[] = [];
    player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    connection: VoiceConnection | null = null;
    isPlaying = false;

    constructor(guildId: string) {
        this.guildId = guildId;

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.isPlaying = false;
            this.processQueue();
        });

        this.player.on('error', error => {
            console.error('Audio Player Error:', error);
            this.isPlaying = false;
            this.processQueue();
        });
    }

    async processQueue(): Promise<void> {
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
            // using current Falcon voices list:
            const voicesWithNoStyle = ['hi-IN-karan', 'en-US-claire', 'hi-IN-namrita', 'hi-IN-sunaina'];

            if (voiceWithConversationStyle.includes(item.voiceId)) {
                payload.style = 'Conversation';
            } else if (!voicesWithNoStyle.includes(item.voiceId)) {
                payload.style = 'Conversational';
            }

            const response = await fetch('https://api.murf.ai/v1/speech/stream', {
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

            // Direct streaming using Readable -> Resource, drastically improving speed and not writing to disk!
            const arrayBuffer = await response.arrayBuffer();
            const stream = Readable.from(Buffer.from(arrayBuffer));
            const resource = createAudioResource(stream);
            
            this.player.play(resource);

            if (item.description) {
                // Ignore editing reply errors gracefully if duplicate edits occur rapidly
                await item.interaction.editReply({ content: item.description }).catch(console.error);
            }

        } catch (error) {
            console.error("Error with TTS:", error);
            await item.interaction.editReply({ content: "❌ An error occurred processing the TTS." }).catch(console.error);
            this.isPlaying = false;
            this.processQueue();
        }
    }
}

const guildQueues = new Map<string, GuildQueue>();

export function getQueue(guildId: string): GuildQueue {
    if (!guildQueues.has(guildId)) {
        guildQueues.set(guildId, new GuildQueue(guildId));
    }
    return guildQueues.get(guildId)!;
}