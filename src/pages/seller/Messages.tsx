import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState, fmtDateTime } from '@/components/seller/ui';

interface Conversation {
  id: string;
  buyer_name: string | null;
  buyer_email: string;
  is_read_by_seller: boolean;
  last_message_at: string;
  products: { name: string } | null;
}

interface Msg {
  id: string;
  sender_role: 'buyer' | 'seller';
  message: string;
  created_at: string;
}

export function SellerMessages() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('conversations')
      .select('id, buyer_name, buyer_email, is_read_by_seller, last_message_at, products(name)')
      .eq('seller_id', profile.id)
      .order('last_message_at', { ascending: false });
    setConversations((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  if (openId) {
    return <ConversationThread conversationId={openId} onBack={() => { setOpenId(null); load(); }} />;
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Messages" subtitle="Communication" />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="When buyers ask questions about your products, conversations will appear here." />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setOpenId(c.id)} className="w-full card flex items-center justify-between text-left">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-dark-text text-light-text truncate">{c.buyer_name || c.buyer_email}</p>
                <p className="text-xs dark:text-dark-muted text-light-muted truncate">{c.products?.name || 'General inquiry'}</p>
              </div>
              <div className="text-right shrink-0">
                {!c.is_read_by_seller && <span className="inline-block w-2 h-2 rounded-full bg-primary mb-1" />}
                <p className="text-xs dark:text-dark-muted text-light-muted">{fmtDateTime(c.last_message_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationThread({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { profile } = useAuth();
  const [conv, setConv] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [c, m] = await Promise.all([
        supabase.from('conversations').select('*, products(name)').eq('id', conversationId).single(),
        supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
      ]);
      setConv(c.data);
      setMessages(m.data || []);
      await supabase.from('conversations').update({ is_read_by_seller: true }).eq('id', conversationId);
    })();

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Msg]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!profile || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_role: 'seller',
      sender_id: profile.id,
      message: text.trim(),
    });
    if (!error) {
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    }
    setSending(false);
    if (error) return toast.error('Could not send message');
    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto animate-fade-in">
      <div className="p-4 border-b dark:border-dark-border border-light-border flex items-center gap-3">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 dark:text-dark-muted text-light-muted" /></button>
        <div className="min-w-0">
          <p className="text-sm font-semibold dark:text-dark-text text-light-text truncate">{conv?.buyer_name || conv?.buyer_email}</p>
          {conv?.products?.name && <p className="text-xs dark:text-dark-muted text-light-muted truncate">{conv.products.name}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] p-3 rounded-xl text-sm ${m.sender_role === 'seller' ? 'bg-primary text-dark ml-auto' : 'dark:bg-dark-surface bg-light-surface dark:text-dark-text text-light-text'}`}>
            {m.message}
            <p className={`text-xs mt-1 ${m.sender_role === 'seller' ? 'text-dark/60' : 'dark:text-dark-muted text-light-muted'}`}>{fmtDateTime(m.created_at)}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t dark:border-dark-border border-light-border flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a reply..." className="input-field text-sm flex-1" />
        <button onClick={send} disabled={sending} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
