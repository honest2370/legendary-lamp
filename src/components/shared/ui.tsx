import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

export function fmtMoney(amount: number | null | undefined, currency = 'XAF') {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

export function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-light-card dark:hover:bg-dark-card dark:text-dark-muted text-light-muted hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold dark:text-dark-text text-light-text">{title}</h1>
          {subtitle && <p className="text-sm dark:text-dark-muted text-light-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-20 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-primary opacity-70" />
        </div>
        <p className="text-sm font-medium dark:text-dark-text text-light-text mb-1">{title}</p>
        {description && <p className="text-sm dark:text-dark-muted text-light-muted max-w-xs">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-danger/30">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-sm font-medium text-danger mb-1">Something went wrong</p>
        <p className="text-xs dark:text-dark-muted text-light-muted mb-3">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-sm text-primary font-medium">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'badge-success',
    confirmed: 'badge-success',
    resolved: 'badge-success',
    active: 'badge-success',
    paid: 'badge-success',
    pending: 'badge-warning',
    processing: 'badge-info',
    open: 'badge-info',
    in_progress: 'badge-info',
    tentative: 'badge-warning',
    failed: 'badge-danger',
    cancelled: 'badge-danger',
    refunded: 'badge-danger',
    closed: 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-info'} capitalize`}>{status?.replace(/_/g, ' ')}</span>;
}

export function ComingSoon({ title, subtitle, reason }: { title: string; subtitle?: string; reason: string }) {
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium dark:text-dark-text text-light-text mb-1">Not built yet</p>
          <p className="text-sm dark:text-dark-muted text-light-muted max-w-xs">{reason}</p>
        </div>
      </div>
    </div>
  );
}
