import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();
  const { user, profile } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Sell Digital Products',
      subtitle: 'Across Africa',
      description: 'E-books, video courses, accounts, software. Sell anything digital with mobile money across 16+ countries.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Instant Payments',
      subtitle: 'Mobile Money First',
      description: 'MTN MoMo, Orange Money, Wave, Airtel Money and more. Get paid instantly with Ashtechpay.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Your Store',
      subtitle: 'Your Rules',
      description: 'Customize your store, manage customers, track analytics. Build your digital empire today.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // If already logged in as seller, go to seller space
  const handleSellerClick = () => {
    if (user && profile?.role === 'seller') {
      navigate('/seller/dashboard');
    } else if (user && profile?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/signup?role=seller');
    }
  };

  return (
    <div className="min-h-screen dark:bg-dark bg-light flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold gradient-text text-lg">SELLIZI</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl dark:bg-dark-card bg-light-card dark:border-dark-border border-light-border border"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 dark:text-dark-text text-light-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 dark:text-dark-text text-light-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        
        {/* Slide Section */}
        <div className="w-full max-w-sm mx-auto mb-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 flex items-center justify-center animate-pulse-glow">
              <div className="text-primary transition-all duration-500">
                {slides[currentSlide].icon}
              </div>
            </div>
          </div>

          {/* Text Content - Fixed height */}
          <div className="text-center h-36 flex flex-col justify-center">
            <h2 className="text-2xl font-bold dark:text-dark-text text-light-text mb-1">
              {slides[currentSlide].title}
            </h2>
            <p className="text-base font-semibold gradient-text mb-3">
              {slides[currentSlide].subtitle}
            </p>
            <p className="text-sm dark:text-dark-muted text-light-muted leading-relaxed px-2">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-8 bg-primary' : 'w-1.5 dark:bg-dark-border bg-light-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto mb-8">
          <div className="card flex flex-col items-center py-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold dark:text-dark-text text-light-text">Shop</span>
          </div>
          <div className="card flex flex-col items-center py-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold dark:text-dark-text text-light-text">Earn</span>
          </div>
          <div className="card flex flex-col items-center py-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-1.5">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold dark:text-dark-text text-light-text">16+ Countries</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm mx-auto mt-auto space-y-3">
          
          {/* START SELLING - Goes to signup as seller */}
          <button
            onClick={handleSellerClick}
            className="btn-primary w-full py-3.5 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {user && profile?.role === 'seller' ? 'Go to Seller Dashboard' : 'Start Selling on SELLIZI'}
          </button>

          {/* BUYER - Goes directly to buyer space, NO LOGIN */}
          <button
            onClick={() => navigate('/buyer/shop')}
            className="btn-secondary w-full py-3.5 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Browse & Buy Products
          </button>

          {/* ACCESS PURCHASE */}
          <button
            onClick={() => navigate('/buyer-access')}
            className="btn-outline w-full py-3.5 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Access My Purchase
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
            <span className="text-xs dark:text-dark-muted text-light-muted font-medium">seller account</span>
            <div className="flex-1 h-px dark:bg-dark-border bg-light-border" />
          </div>

          {/* SELLER LOGIN */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl font-medium dark:bg-dark-card bg-light-card dark:border-dark-border border-light-border border flex items-center justify-center gap-3 dark:text-dark-text text-light-text transition-all hover:border-primary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In as Seller
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 text-center safe-bottom">
        <p className="text-[11px] dark:text-dark-muted text-light-muted">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary">Terms</a> and{' '}
          <a href="/privacy" className="text-primary">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
