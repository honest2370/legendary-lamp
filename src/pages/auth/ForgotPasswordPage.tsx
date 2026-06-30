import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-dark bg-light flex flex-col px-6 py-12 safe-top">
      <button onClick={() => navigate('/login')} className="mb-8 p-2 rounded-xl dark:text-dark-text text-light-text self-start">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {!sent ? (
          <>
            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">Reset Password</h1>
              <p className="text-sm dark:text-dark-muted text-light-muted mt-1">Enter your email and we'll send you a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium dark:text-dark-muted text-light-muted mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold dark:text-dark-text text-light-text mb-2">Check Your Email</h2>
            <p className="text-sm dark:text-dark-muted text-light-muted mb-6">We've sent a password reset link to <strong>{email}</strong></p>
            <button onClick={() => navigate('/login')} className="btn-outline">Back to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}
