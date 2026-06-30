// Supabase Edge Function: Check Ashtechpay Transaction Status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top'
const ASHTECHPAY_API_KEY = Deno.env.get('ASHTECHPAY_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const url = new URL(req.url)
    const transactionId = url.searchParams.get('transaction_id') || ''

    if (!transactionId) {
      // Try from body
      const body = await req.json().catch(() => ({}))
      if (body.transaction_id) {
        const statusResponse = await fetch(
          `${ASHTECHPAY_BASE_URL}/v1/transaction/${body.transaction_id}`,
          { headers: { 'Authorization': `Bearer ${ASHTECHPAY_API_KEY}` } }
        )
        const data = await statusResponse.json()

        // Update local payment record
        if (data.status === 'success' || data.status === 'failed') {
          await supabase
            .from('payments')
            .update({ 
              status: data.status,
              confirmed_at: data.confirmed_at 
            })
            .eq('transaction_id', body.transaction_id)
        }

        return new Response(
          JSON.stringify(data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'transaction_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const statusResponse = await fetch(
      `${ASHTECHPAY_BASE_URL}/v1/transaction/${transactionId}`,
      { headers: { 'Authorization': `Bearer ${ASHTECHPAY_API_KEY}` } }
    )

    const data = await statusResponse.json()

    // Update local payment record
    if (data.status === 'success' || data.status === 'failed') {
      await supabase
        .from('payments')
        .update({ 
          status: data.status,
          confirmed_at: data.confirmed_at 
        })
        .eq('transaction_id', transactionId)
    }

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
