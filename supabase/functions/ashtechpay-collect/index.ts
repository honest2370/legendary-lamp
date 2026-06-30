// Supabase Edge Function: Ashtechpay Payment Collection
// This function securely handles payment initiation using the Ashtechpay API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top'
const ASHTECHPAY_API_KEY = Deno.env.get('ASHTECHPAY_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const body = await req.json()
    
    const { amount, currency, phone, operator, country_code, reference, otp, notify_url, order_id } = body

    // Validate required fields
    if (!amount || !currency || !phone || !operator || !country_code) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Ashtechpay API
    const collectResponse = await fetch(`${ASHTECHPAY_BASE_URL}/v1/collect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASHTECHPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        phone,
        operator,
        country_code,
        reference: reference || `SELLIZI-${Date.now()}`,
        otp,
        notify_url: notify_url || `${SUPABASE_URL}/functions/v1/ashtechpay-webhook`,
      }),
    })

    const data = await collectResponse.json()

    // Store payment record in database
    if (collectResponse.status === 202 || (collectResponse.status === 400 && data.error === 'otp_required')) {
      await supabase.from('payments').insert({
        transaction_id: data.transaction_id,
        reference: data.reference || reference,
        amount: data.amount || amount,
        fee_amount: data.fee_amount || 0,
        net_amount: data.credited_amount || amount,
        currency: data.currency || currency,
        phone: data.phone || phone,
        operator: data.operator || operator,
        country_code: data.country_code || country_code,
        status: data.status || 'pending',
        flow_type: data.flow || 'ussd_push',
        otp_required: data.error === 'otp_required',
        wave_url: data.wave_url || null,
        raw_response: data,
        order_id: order_id || null,
      })
    }

    // Return response based on flow type
    if (collectResponse.status === 202 && data.flow === 'wave') {
      return new Response(
        JSON.stringify({
          type: 'wave',
          transaction_id: data.transaction_id,
          wave_url: data.wave_url,
          status: data.status,
          amount: data.amount,
          credited_amount: data.credited_amount,
          fee_amount: data.fee_amount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (collectResponse.status === 202) {
      return new Response(
        JSON.stringify({
          type: 'ussd_push',
          transaction_id: data.transaction_id,
          status: data.status,
          amount: data.amount,
          credited_amount: data.credited_amount,
          fee_amount: data.fee_amount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (collectResponse.status === 400 && data.error === 'otp_required') {
      return new Response(
        JSON.stringify({
          type: data.ussd_code ? 'otp_ussd' : 'otp_sms',
          otp_required: true,
          ussd_code: data.ussd_code || null,
          message: data.message,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Error response
    return new Response(
      JSON.stringify({ error: data.error || 'payment_error', message: data.message }),
      { status: collectResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
