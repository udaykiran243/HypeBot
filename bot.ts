import { Client, GatewayIntentBits, REST, Routes, Collection } from 'discord.js';
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getQueue } from './utils/queue.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Client to hold commands
declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
    }
}

// Create a dummy web server so Render.com's "Web Service" thinks we are a website
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HypeBot is alive and running with the new architecture!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌍 Dummy web server listening on port ${PORT}`);
});

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!DISCORD_TOKEN) console.warn("⚠️ Warning: DISCORD_BOT_TOKEN is missing in .env");

// Create Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Command Handler Execution
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
const registeredCommands: any[] = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandUrl = pathToFileURL(filePath).href;
    const command = await import(commandUrl);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        registeredCommands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once('clientReady', async () => {
    console.log(`🤖 Logged in as ${client.user?.tag}! Deploying slash commands...`);
    if (client.user && DISCORD_TOKEN) {
        const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: registeredCommands });
            console.log('✅ Slash commands deployed globally!');
        } catch (error) {
            console.error('Error deploying commands:', error);
        }
    }
});

// Voice State Handling (Auto-cleanup when bot gets disconnected manually)
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelId && !newState.channelId && newState.id === client.user?.id) {
        const queue = getQueue(newState.guild.id);
        if (queue.connection) {
            console.log(`Bot was disconnected from ${newState.guild.id}, cleaning up queue...`);
            queue.connection.destroy();
            queue.connection = null;
            queue.queue = [];
            queue.isPlaying = false;
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

if (DISCORD_TOKEN) {
    client.login(DISCORD_TOKEN);
} else {
    console.log("Waiting for Discord Token to start the bot...");
}