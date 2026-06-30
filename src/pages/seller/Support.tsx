import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, Send, Plus, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, StatusBadge, fmtDateTime } from '@/components/seller/ui';

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  created_at: string;
}

interface TicketMsg {
  id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export function SellerSupport() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'normal' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  const createTicket = async () => {
    if (!profile) return;
    if (!form.subject.trim()) return toast.error('Enter a subject');
    setCreating(true);
    const { error } = await supabase.functions.invoke('create-ticket', {
      body: { user_id: profile.id, ...form },
    });
    setCreating(false);
    if (error) return toast.error('Could not create ticket');
    toast.success('Ticket created');
    setShowNew(false);
    setForm({ subject: '', description: '', category: 'general', priority: 'normal' });
    load();
  };

  if (openId) {
    return <TicketThread ticketId={openId} onBack={() => { setOpenId(null); load(); }} />;
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Support Tickets"
        subtitle="Get help"
        action={
          <button onClick={() => setShowNew((s) => !s)} className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        }
      />

      {showNew && (
        <div className="card mb-4 space-y-3">
          <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="input-field text-sm" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your issue..." rows={3} className="input-field text-sm resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field text-sm">
              <option value="general">General</option>
              <option value="payment">Payment</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
            </select>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="input-field text-sm">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button onClick={createTicket} disabled={creating} className="btn-primary w-full text-sm py-2.5">{creating ? 'Submitting...' : 'Submit ticket'}</button>
        </div>
      )}

      {loading ? (
        <LoadingBlock rows={3} />
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets yet" description="Need help? Open a ticket and our team will respond here." />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full card text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{t.subject}</p>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-xs dark:text-dark-muted text-light-muted capitalize">{t.category} · {t.priority} priority · {fmtDateTime(t.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const { profile } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [t, m] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', ticketId).single(),
      supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
    ]);
    setTicket(t.data);
    setMessages(m.data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as TicketMsg]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!profile || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.functions.invoke('send-ticket-message', {
      body: { ticket_id: ticketId, sender_id: profile.id, message: text.trim(), is_admin: false },
    });
    setSending(false);
    if (error) return toast.error('Could not send message');
    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto animate-fade-in">
      <div className="p-4 border-b dark:border-dark-border border-light-border flex items-center gap-3">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        <div className="min-w-0">
          <p className="text-sm font-semibold dark:text-dark-text text-light-text truncate">{ticket?.subject}</p>
          {ticket && <StatusBadge status={ticket.status} />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ticket?.description && (
          <div className="card text-sm dark:text-dark-text text-light-text">{ticket.description}</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] p-3 rounded-xl text-sm ${m.is_admin ? 'dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text' : 'bg-primary text-dark ml-auto'}`}>
            {m.message}
            <p className={`text-xs mt-1 ${m.is_admin ? 'dark:text-dark-muted text-light-muted' : 'text-dark/60'}`}>{fmtDateTime(m.created_at)}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t dark:border-dark-border border-light-border flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message..." className="input-field text-sm flex-1" />
        <button onClick={send} disabled={sending} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function SellerNotifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        action={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="text-sm text-primary font-medium">Mark all read</button>
          ) : undefined
        }
      />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => !n.is_read && markRead(n.id)} className={`w-full card text-left flex items-start gap-3 ${!n.is_read ? 'border-primary/40' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-primary/10' : 'dark:bg-dark-surface bg-light-surface'}`}>
                <Bell className={`w-4 h-4 ${!n.is_read ? 'text-primary' : 'dark:text-dark-muted text-light-muted'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-dark-text text-light-text">{n.title}</p>
                {n.message && <p className="text-xs dark:text-dark-muted text-light-muted">{n.message}</p>}
                <p className="text-xs dark:text-dark-muted text-light-muted mt-1">{fmtDateTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
