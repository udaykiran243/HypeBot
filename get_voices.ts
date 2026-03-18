import dotenv from 'dotenv';
dotenv.config();

const MURF_API_KEY = process.env.MURF_FALCON_API_KEY;

async function run() {
    const response = await fetch('https://api.murf.ai/v1/speech/voices?model=FALCON', {
        method: 'GET',
        headers: {
            'api-key': MURF_API_KEY as string,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    console.log(data.filter((v: any) => v.locale.toLowerCase().includes('in')).map((v: any) => `${v.locale} - ${v.voiceId} (${v.gender} - Models: ${v.availableModels})`).join('\n'));
}

run();