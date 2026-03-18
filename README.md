# HypeBot - AI Voice Co-Worker for Discord

HypeBot is a Discord bot that joins your voice channel as a live AI commentator, hype man, and code reviewer. Powered by Murf Falcon with ~130ms latency.

Built for the Murf Falcon Monthly Buildathon.

## Getting Started

### Prerequisites
- Node.js & npm installed

### Setup

```sh
# Install dependencies
npm i

# Start the development server
npm run dev

# Start the bot
npm run start:bot
```

## Technologies Used
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase Edge Functions (for proxying Murf API)
- Murf Falcon API

## Overview
This repo currently houses the Vite/React landing page for HypeBot, where users can interact with a live demo of the Murf Falcon TTS. The Discord integration and backend logic are being developed to connect directly to voice channels.
