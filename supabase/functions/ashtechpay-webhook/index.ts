// Supabase Edge Function: Ashtechpay Webhook Handler
// Handles payment completion/failure webhooks from Ashtechpay

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
    const body = await req.json()

    const { event, transaction_id, reference, status, amount, total_amount, currency, phone, timestamp } = body

    // Always respond 200 first
    const response = new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    // Process asynchronously
    const processWebhook = async () => {
      // Update payment record
      const { data: payment } = await supabase
        .from('payments')
        .select('*, orders(*)')
        .eq('transaction_id', transaction_id)
        .single()

      if (!payment) {
        console.error('Payment not found for transaction:', transaction_id)
        return
      }

      if (event === 'payment.completed') {
        // Update payment status
        await supabase
          .from('payments')
          .update({ 
            status: 'success', 
            confirmed_at: timestamp,
            webhook_data: body 
          })
          .eq('transaction_id', transaction_id)

        // Update order status
        if (payment.order_id) {
          await supabase
            .from('orders')
            .update({ 
              status: 'completed',
              completed_at: timestamp,
              delivery_status: 'delivered'
            })
            .eq('id', payment.order_id)

          // Get order and product details for notification
          const { data: order } = await supabase
            .from('orders')
            .select('*, products(*)')
            .eq('id', payment.order_id)
            .single()

          if (order) {
            // Update product sales count
            await supabase.rpc('increment_product_sales', { 
              product_id: order.product_id 
            }).catch(() => {})

            // Create notification for seller
            await supabase.from('notifications').insert({
              user_id: order.seller_id,
              type: 'order_received',
              title: 'New Order Received',
              message: `You have a new order for ${amount} ${currency}`,
              data: { order_id: order.id, transaction_id, amount }
            })

            // Create buyer access record
            await supabase.from('buyer_access').insert({
              email: order.buyer_email,
              order_id: order.id,
              product_id: order.product_id,
              seller_id: order.seller_id,
              pin: order.buyer_pin,
              is_active: true,
            })

            // Record analytics sale
            await supabase.from('analytics_sales').insert({
              store_id: order.store_id,
              seller_id: order.seller_id,
              product_id: order.product_id,
              order_id: order.id,
              amount: amount,
              currency: currency,
            })
          }
        }
      }

      if (event === 'payment.failed') {
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            webhook_data: body 
          })
          .eq('transaction_id', transaction_id)

        if (payment.order_id) {
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', payment.order_id)

          // Notify seller of failed payment
          const { data: order } = await supabase
            .from('orders')
            .select('seller_id')
            .eq('id', payment.order_id)
            .single()

          if (order) {
            await supabase.from('notifications').insert({
              user_id: order.seller_id,
              type: 'payment_failed',
              title: 'Payment Failed',
              message: `A payment of ${total_amount} ${currency} has failed`,
              data: { transaction_id, order_id: payment.order_id }
            })
          }
        }
      }
    }

    // Run async processing
    processWebhook().catch(console.error)

    return response

  } catch (error) {
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
