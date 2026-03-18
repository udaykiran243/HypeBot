# **HypeBot**

A Discord bot that joins your voice channel to instantly translate your text into flawless Native Speech across 8+ languages using `Murf Falcon`.

### **The Stack**
* **Runtime:** TypeScript & Node.js (via `tsx` for instant execution).
* **Bot Framework:** `discord.js v14` + `@discordjs/voice` for handling UDP audio streaming into voice channels.

### **The Translation Layer (`google-translate-api-x`)**
* **Why not use Murf to translate?** Because Murf's API is a *Synthesizer*, not a Translator. If you send English text to a French Murf voice, it just reads English words with a heavy French accent.
* **The Solution:** We use `google-translate-api-x` to instantly translate the text *first* (100% free bypassing Cloud paywalls), and then pass that translated text to Murf for native pronunciation.

### **The TTS Engine (Murf.ai FALCON)**
* **Why Murf?** Standard free TTS bots sound robotic. Murf provides enterprise-grade **FALCON** models for studio-quality, highly humanized voices.
* **Native Mapping:** The bot uses a custom `VOICE_MAP` to automatically switch to native male/female speakers based on the requested language.

### **In-Memory Audio (Zero File Downloads)**
* **The Problem:** Murf returns audio as an `ArrayBuffer` over the network, which Discord cannot play directly. 
* **The Solution:** Instead of downloading audio to the server’s hard drive, we pipe the buffer directly into a virtual Node.js `Readable` stream. This plays the audio straight from RAM, keeping latency incredibly low (~130ms).

###  **Smart Audio Queuing**
* **The Problem:** The bot used to overlap the English and Translated audio, or cut off early.
* **The Solution:** We replaced hardcoded timeouts with Discord's native event listener: `entersState(player, AudioPlayerStatus.Idle)`. Now, the translated audio waits *exactly* until the English audio finishes perfectly.

### **The Free Hosting Hack (Render.com)**
* **The Problem:** Discord bots are "Background Workers". Cloud hosts like Render charge for background workers.
* **The Hack:** We attached a tiny, fake HTTP web server to the bot code. This tricks Render into categorizing it as a free "Web Service", allowing 24/7 hosting without a credit card! 

### **Command Lifecycle Flow:**
:one: User types `!say-translate fr Hello World!`
:two: `google-translate-api-x` covertly translates "Hello World!" ➔ "Bonjour le monde!"
:three: Node hits the Murf API for an English voice ➔ Converts to RAM stream ➔ Speaks "Hello World!".
:four: `AudioPlayer` detects the exact millisecond the English voice finishes.
:five: The bot instantly streams the *French* Murf female voice speaking "Bonjour le monde!".

## **Links**
* **GitHub Repo:** https://github.com/udaykiran243/HypeBot
* **Invite the Bot:** [Click here to add HypeBot to your server](https://discord.com/oauth2/authorize?client_id=1483811116898586717)
