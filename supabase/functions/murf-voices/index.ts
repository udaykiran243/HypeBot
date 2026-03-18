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

    console.log('Fetching Falcon voices with API key prefix:', apiKey.substring(0, 6));

    const response = await fetch('https://api.murf.ai/v1/speech/voices?model=FALCON', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });

    const responseText = await response.text();
    console.log('Murf API status:', response.status);
    console.log('Murf API response:', responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`Murf API error [${response.status}]: ${responseText}`);
    }

    return new Response(responseText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
