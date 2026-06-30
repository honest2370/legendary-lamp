// Supabase Edge Function: Get Ashtechpay Countries & Operators

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top'
const ASHTECHPAY_API_KEY = Deno.env.get('ASHTECHPAY_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const response = await fetch(`${ASHTECHPAY_BASE_URL}/v1/countries`, {
      headers: { 'Authorization': `Bearer ${ASHTECHPAY_API_KEY}` },
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
