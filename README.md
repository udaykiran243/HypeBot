# **HypeBot - AI Voice Translator**

A high-performance Discord bot that joins your voice channel to instantly translate text into flawless Native Speech across 8+ languages using **Murf Falcon**.

---

## 🚀 **Bot Commands (Slash Commands)**

The bot has been upgraded to an enterprise-grade **Slash Command** (`/`) architecture for simple, UI-driven command execution. It currently supports:

### `/languages`
Returns a list of all currently supported language codes for translation.

### `/say <text>`
The bot simply speaks the text entered in a native English voice.

### `/translate <language_code> <text>`
*(Auto-detects the origin language!)* 
Enter any text in any language, and the bot will auto-detect the source language, translate it to your target `<language_code>`, and speak it in a flawless, native-sounding Murf voice for that country.

### `/say-translate <language_code> <text>`
The bot will join your current voice channel, speak the original text using the voice of the detected origin language, instantly translate it, and speak the translated text using a native-sounding voice of the target language.

**Examples Targets:**
`es` (Spanish) | `fr` (French) | `de` (German) | `hi` (Hindi) | `ja` (Japanese) | `it` (Italian) | `pt` (Portuguese) | `te` (Telugu)


---

## 🛠️ **How to Run Locally**

### 1. Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn
* A Discord Bot Token
* A Murf.ai API Key

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/udaykiran243/HypeBot.git
cd HypeBot
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your keys:
```env
DISCORD_BOT_TOKEN="your_discord_token_here"
MURF_FALCON_API_KEY="your_murf_api_key_here"
```

### 4. Start the Application
```bash
# To start the Discord Bot
npm start
```

---

## 🏗️ **The Architecture & Stack**

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

### **Smart Audio Queuing**
* **The Problem:** The bot used to overlap the English and Translated audio, or cut off early.
* **The Solution:** We replaced hardcoded timeouts with Discord's native event listener: `entersState(player, AudioPlayerStatus.Idle)`. Now, the translated audio waits *exactly* until the English audio finishes perfectly.

### **The Free Hosting Hack (Render.com)**
* **The Problem:** Discord bots are "Background Workers". Cloud hosts like Render charge for background workers.
* **The Hack:** We attached a tiny, fake HTTP web server to the bot code. This tricks Render into categorizing it as a free "Web Service", allowing 24/7 hosting without a credit card!

## **Links**
* **GitHub Repo:** https://github.com/udaykiran243/HypeBot
* **Invite the Bot:** [Click here to add HypeBot to your server](https://discord.com/oauth2/authorize?client_id=1483811116898586717)
