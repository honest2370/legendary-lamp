import { useEffect, useState } from 'react';
import { Bell, BellOff, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingBlock, EmptyState, fmtDateTime } from '@/components/shared/ui';

export function BuyerNotifications() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => {
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

  if (!profile) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in flex flex-col items-center justify-center min-h-[70vh] text-center">
        <LogIn className="w-10 h-10 text-primary mb-3" />
        <p className="text-base font-semibold dark:text-dark-text text-light-text mb-1">Sign in to see notifications</p>
        <button onClick={() => navigate('/login')} className="btn-primary text-sm px-4 py-2 mt-2">Sign in</button>
      </div>
    );
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold dark:text-dark-text text-light-text">Notifications</h1>
          <p className="text-sm dark:text-dark-muted text-light-muted">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="text-sm text-primary font-medium">Mark all read</button>}
      </div>
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
