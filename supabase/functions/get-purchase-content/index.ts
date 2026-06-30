// Supabase Edge Function: Get Purchase Content for guest (email+PIN) buyers
//
// WHY THIS EXISTS: product_delivery_data is locked down by RLS to the
// product's seller or the authenticated buyer_id on the order. Guest
// buyers in this app authenticate with an email + 5-digit PIN against
// buyer_access, NOT Supabase Auth — they have no auth.uid() at all, so
// they can never pass that RLS check directly from the client. This
// function verifies the email+PIN server-side with the service role key
// (bypassing RLS) and returns only that buyer's own delivery content.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { email, pin } = await req.json()

    if (!email || !pin) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'Email and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: access, error: accessError } = await supabase
      .from('buyer_access')
      .select('order_id, product_id')
      .eq('email', email.toLowerCase())
      .eq('pin', pin)
      .eq('is_active', true)

    if (accessError || !access || access.length === 0) {
      return new Response(
        JSON.stringify({ error: 'invalid_pin', message: 'Invalid email or PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const orderIds = access.map((a) => a.order_id).filter(Boolean)
    const productIds = access.map((a) => a.product_id).filter(Boolean)

    const [productsRes, deliveryRes] = await Promise.all([
      supabase.from('products').select('id, name, type, image_url, description').in('id', productIds),
      supabase.from('product_delivery_data').select('*').in('order_id', orderIds),
    ])

    // update access_count / last_accessed_at for the matched rows
    await supabase
      .from('buyer_access')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('pin', pin)

    const results = (productsRes.data || []).map((p) => {
      const access_row = access.find((a) => a.product_id === p.id)
      const delivery = (deliveryRes.data || []).find((d: any) => d.order_id === access_row?.order_id)
      return { product: p, delivery: delivery || null }
    })

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
