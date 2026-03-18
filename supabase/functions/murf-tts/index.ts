import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MURF_FALCON_API_KEY');
    if (!apiKey) {
      throw new Error('MURF_FALCON_API_KEY is not configured');
    }

    const { text, voiceId, style } = await req.json();

    if (!text || !voiceId) {
      return new Response(JSON.stringify({ error: 'text and voiceId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating Falcon TTS for voice:', voiceId, 'text length:', text.length);

    const response = await fetch('https://global.api.murf.ai/v1/speech/stream', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        model: 'FALCON',
        ...(style && { style }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Murf Falcon TTS error:', response.status, errorText);
      throw new Error(`Murf Falcon API error [${response.status}]: ${errorText}`);
    }

    const audioData = await response.arrayBuffer();
    console.log('Audio generated, size:', audioData.byteLength);

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
