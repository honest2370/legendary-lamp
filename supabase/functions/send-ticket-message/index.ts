// Supabase Edge Function: Send Ticket Message with File Attachments

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
    const { ticket_id, sender_id, message, attachments, is_admin } = await req.json()

    // Handle file uploads if any
    let uploadedFiles: any[] = []
    
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.base64) {
          const filePath = `ticket-attachments/${ticket_id}/${Date.now()}-${file.name}`
          const fileData = Uint8Array.from(atob(file.base64), c => c.charCodeAt(0))
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, fileData, {
              contentType: file.type || 'application/octet-stream',
            })

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath)
            
            uploadedFiles.push({
              name: file.name,
              url: urlData.publicUrl,
              size: file.size,
              type: file.type,
            })
          }
        } else if (file.url) {
          uploadedFiles.push(file)
        }
      }
    }

    // Create message
    const { data: msg, error: msgError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id,
        sender_id,
        message,
        attachments: uploadedFiles,
        is_admin: is_admin || false,
      })
      .select()
      .single()

    if (msgError) throw msgError

    // Update ticket status
    await supabase
      .from('support_tickets')
      .update({ 
        status: is_admin ? 'in_progress' : 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticket_id)

    // Notify recipient
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('user_id')
      .eq('id', ticket_id)
      .single()

    if (ticket) {
      const notifyUserId = is_admin ? ticket.user_id : null
      if (notifyUserId) {
        await supabase.from('notifications').insert({
          user_id: notifyUserId,
          type: 'new_message',
          title: 'New Message',
          message: `New reply on your support ticket`,
          data: { ticket_id, message_id: msg.id },
          is_read: false,
        })
      }
    }

    // Notify admin if user sent message
    if (!is_admin) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'new_message',
          title: 'New Ticket Message',
          message: `New message on ticket`,
          data: { ticket_id, message_id: msg.id },
          is_read: false,
        }))
        await supabase.from('notifications').insert(notifications)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: msg, attachments: uploadedFiles }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
