// Supabase Edge Function: Create Support Ticket with File Upload

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
    const { user_id, subject, description, category, priority, attachments } = body

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
      })
      .select()
      .single()

    if (ticketError) throw ticketError

    // Create initial message
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user_id,
        message: description,
        attachments: attachments || [],
        is_admin: false,
      })

    if (messageError) throw messageError

    // Notify admin
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'new_ticket',
        title: 'New Support Ticket',
        message: `New ticket: ${subject}`,
        data: { ticket_id: ticket.id },
        is_read: false,
      }))
      await supabase.from('notifications').insert(notifications)
    }

    return new Response(
      JSON.stringify({ success: true, ticket }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
