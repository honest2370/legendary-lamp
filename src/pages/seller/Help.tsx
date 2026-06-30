import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, HelpCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/seller/ui';

export function SellerLegalPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('legal_pages').select('*').eq('is_published', true).then(({ data }) => {
      setPages(data || []);
      setLoading(false);
    });
  }, []);

  if (open) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in">
        <PageHeader title={open.title} back={false} action={<button onClick={() => setOpen(null)} className="text-sm text-primary font-medium">Back</button>} />
        <div className="card text-sm dark:text-dark-text text-light-text whitespace-pre-wrap">{open.content || 'No content yet.'}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Legal Pages" subtitle="Platform terms & policies" back />
      {loading ? (
        <LoadingBlock rows={3} />
      ) : pages.length === 0 ? (
        <EmptyState icon={FileText} title="No legal pages published yet" />
      ) : (
        <div className="space-y-2">
          {pages.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="w-full card flex items-center justify-between text-left">
              <span className="text-sm font-medium dark:text-dark-text text-light-text">{p.title}</span>
              <ChevronRight className="w-4 h-4 dark:text-dark-muted text-light-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerHelp() {
  const [topics, setTopics] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('help_topics').select('*').eq('is_published', true).order('order_index').then(({ data }) => {
      setTopics(data || []);
      setLoading(false);
    });
  }, []);

  const categories = Array.from(new Set(topics.map((t) => t.category || 'General')));

  if (open) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-fade-in">
        <PageHeader title={open.title} back={false} action={<button onClick={() => setOpen(null)} className="text-sm text-primary font-medium">Back</button>} />
        <div className="card text-sm dark:text-dark-text text-light-text whitespace-pre-wrap">{open.content || 'No content yet.'}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title="Help Center" back />
      {loading ? (
        <LoadingBlock rows={4} />
      ) : topics.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No help articles yet" description="Contact support if you need help in the meantime." />
      ) : (
        categories.map((cat) => (
          <div key={cat} className="mb-4">
            <p className="text-sm font-semibold dark:text-dark-muted text-light-muted uppercase tracking-wider mb-2">{cat}</p>
            <div className="space-y-2">
              {topics.filter((t) => (t.category || 'General') === cat).map((t) => (
                <button key={t.id} onClick={() => setOpen(t)} className="w-full card flex items-center justify-between text-left">
                  <span className="text-sm font-medium dark:text-dark-text text-light-text">{t.title}</span>
                  <ChevronRight className="w-4 h-4 dark:text-dark-muted text-light-muted" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
