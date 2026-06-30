// Supabase Edge Function: Send Broadcast Notifications

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
    const { title, message, type, target, target_emails, admin_id } = await req.json()

    // Store broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        admin_id,
        title,
        message,
        type: type || 'info',
        target: target || 'all',
        target_emails: target_emails || [],
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (broadcastError) throw broadcastError

    // Get target users
    let query = supabase.from('profiles').select('id, email')
    
    if (target === 'sellers') {
      query = query.eq('role', 'seller')
    } else if (target === 'buyers') {
      query = query.eq('role', 'buyer')
    } else if (target === 'specific' && target_emails?.length) {
      query = query.in('email', target_emails)
    }

    const { data: users } = await query

    if (users && users.length > 0) {
      // Create notifications for each user
      const notifications = users.map(user => ({
        user_id: user.id,
        type: 'broadcast',
        title,
        message,
        data: { broadcast_id: broadcast.id, broadcast_type: type },
        is_read: false,
      }))

      // Batch insert notifications
      await supabase.from('notifications').insert(notifications)
    }

    return new Response(
      JSON.stringify({ success: true, broadcast_id: broadcast.id, recipients: users?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
