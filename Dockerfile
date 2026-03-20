FROM node:20-bullseye-slim

# Install necessary requirements for audio processing (@discordjs/voice)
RUN apt-get update && \
    apt-get install -y ffmpeg libsodium-dev python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create App Directory
WORKDIR /app

# Install Dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose port (if your host requires web listeners to stay alive)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]