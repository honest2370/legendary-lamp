import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageStubProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  description?: string;
  actions?: Array<{ label: string; path: string; variant?: string }>;
  stats?: Array<{ label: string; value: string; change?: string; color?: string }>;
  children?: React.ReactNode;
}

export default function PageStub({ title, subtitle, icon, description, actions, stats, children }: PageStubProps) {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
          <div>
            <h1 className="text-xl font-bold dark:text-dark-text text-light-text">{title}</h1>
            {subtitle && <p className="text-sm dark:text-dark-muted text-light-muted">{subtitle}</p>}
          </div>
        </div>
        {description && <p className="text-sm dark:text-dark-muted text-light-muted mt-2">{description}</p>}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="card">
              <p className="text-xs dark:text-dark-muted text-light-muted mb-1">{stat.label}</p>
              <p className="text-xl font-bold dark:text-dark-text text-light-text">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs font-medium mt-1 ${stat.color || 'text-primary'}`}>{stat.change}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                action.variant === 'secondary'
                  ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                  : action.variant === 'accent'
                  ? 'bg-accent/10 text-accent hover:bg-accent/20'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {children ? children : (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="w-12 h-12 dark:text-dark-muted text-light-muted mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm dark:text-dark-muted text-light-muted text-center">
              This feature is loading. Content will appear here once data is available from the database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
