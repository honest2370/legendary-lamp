import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES } from '@/lib/config';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';
  const { signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', country: '', role: initialRole as 'buyer' | 'seller' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) { toast.error('Please fill in all required fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(form);
      toast.success(`Account created! Welcome to SELLIZI.`);
      // Redirect based on role
      if (form.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/buyer/shop');
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-dark bg-light flex flex-col px-6 py-8 safe-top">
      <button onClick={() => step === 1 ? navigate('/') : setStep(1)} className="mb-6 p-2 rounded-xl dark:text-dark-text text-light-text self-start">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 max-w-sm mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">
            Create {form.role === 'seller' ? 'Seller' : 'Buyer'} Account
          </h1>
          <p className="text-sm dark:text-dark-muted text-light-muted mt-1">
            {form.role === 'seller' ? 'Start selling digital products today' : 'Join SELLIZI to buy digital products'}
          </p>
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'dark:bg-dark-border bg-light-border'}`} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'buyer', label: 'Buy Products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                  { role: 'seller', label: 'Sell Products', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => updateForm('role', item.role)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      form.role === item.role
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'dark:border-dark-border border-light-border dark:text-dark-muted text-light-muted'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Full Name *</label>
              <input value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} placeholder="Your full name" className="input-field" />
            </div>

            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Email *</label>
              <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="you@example.com" className="input-field" />
            </div>

            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Password *</label>
              <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="Min 6 characters" className="input-field" />
            </div>

            <button onClick={() => { if (form.full_name && form.email && form.password) setStep(2); else toast.error('Fill required fields'); }} className="btn-primary w-full py-3.5 text-base">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className="input-field" />
            </div>

            <div>
              <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Country</label>
              <select value={form.country} onChange={(e) => updateForm('country', e.target.value)} className="input-field">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="p-4 rounded-xl dark:bg-dark-surface bg-light-surface">
              <p className="text-xs dark:text-dark-muted text-light-muted">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-primary">Terms</a> and{' '}
                <a href="/privacy" className="text-primary">Privacy Policy</a>
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" /> : `Create ${form.role === 'seller' ? 'Seller' : 'Buyer'} Account`}
            </button>

            <div className="flex items-center gap-4 my-3">
              <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
              <span className="text-xs dark:text-dark-muted text-light-muted">or</span>
              <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
            </div>

            <button type="button" onClick={async () => { try { await signInWithGoogle(); } catch(e: any) { toast.error(e.message); } }}
              className="w-full py-3 rounded-xl font-medium dark:bg-dark-card bg-light-card dark:border-dark-border border-light-border border flex items-center justify-center gap-3 dark:text-dark-text text-light-text">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>

            <p className="text-center text-sm dark:text-dark-muted text-light-muted">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-primary font-medium">Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
