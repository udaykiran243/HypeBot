import dotenv from 'dotenv';
dotenv.config();

const MURF_API_KEY = process.env.MURF_FALCON_API_KEY;

async function run(voiceId: string, text: string) {
    const response = await fetch('https://global.api.murf.ai/v1/speech/stream', {
        method: 'POST',
        headers: {
            'api-key': MURF_API_KEY as string,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            voiceId: voiceId,
            model: 'GEN2'
        }),
    });
    if (!response.ok) {
        console.error(await response.text());
    } else {
        console.log(`Success for ${voiceId}`);
    }
}

run('fr-FR-louise', 'Bonjour tout le monde');
run('pt-BR-isadora', 'Olá mundo');