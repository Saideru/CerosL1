import React, { useState, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CerosLogo } from '../CerosLogo';
import {
  Lock,
  Mail,
  Building,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const emailInputId = useId();
  const passInputId = useId();
  const nameInputId = useId();
  const companyInputId = useId();

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(signInEmail, signInPassword);
      if (!res.success && res.error) {
        setSignInError(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setIsSubmitting(true);

    try {
      const res = await signUp({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        companyName: signUpCompany
      });
      if (!res.success && res.error) {
        setSignUpError(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^\S+@\S+\.\S+$/.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid work email address.');
      return;
    }
    setForgotError(null);
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#059669] selection:text-white antialiased">
      {/* Top Quiet Minimal Bar */}
      <header className="px-6 py-5 border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CerosLogo size={32} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[18px] tracking-tight text-[#F8FAFC]">
              CerosL1
            </span>
            <span className="text-[12px] font-semibold text-[#34D399] tracking-normal">
              Ledger &amp; Calculator
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#94A3B8]">
          <span>Executive Modernist Accounting</span>
          <span>·</span>
          <span>Standard Operating Procedure CL1-SOP-001</span>
        </div>
      </header>

      {/* Center Auth Card Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[460px] bg-[#111B2E] border border-[#1E293B] rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Header Segment */}
          <div className="p-6 pb-4 border-b border-[#1E293B]">
            <div className="flex items-center justify-between mb-4">
              <CerosLogo size={40} />
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#34D399] bg-[#059669]/10 border border-[#059669]/20 px-2.5 py-1 rounded-full">
                Secure Access
              </span>
            </div>

            <h1 className="text-[22px] font-bold tracking-tight text-[#F8FAFC]">
              {tab === 'signin' && 'Sign in to CerosL1'}
              {tab === 'signup' && 'Create an account'}
              {tab === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-1 leading-relaxed">
              {tab === 'signin' && 'Access the double-entry calculator and verified ledger tools.'}
              {tab === 'signup' && 'Register your organisation to begin balancing and verifying books.'}
              {tab === 'forgot' && 'Enter your registered work email to receive a secure recovery link.'}
            </p>

            {/* Mode Switcher Tabs */}
            {tab !== 'forgot' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0F172A] border border-[#1E293B] rounded-[8px] mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setSignInError(null);
                  }}
                  className={`py-2 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                    tab === 'signin'
                      ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setSignUpError(null);
                  }}
                  className={`py-2 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                    tab === 'signup'
                      ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Create an account
                </button>
              </div>
            )}
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {/* 1. SIGN IN FORM */}
            {tab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {signInError && (
                  <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#F87171]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{signInError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor={emailInputId}
                    className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={emailInputId}
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor={passInputId}
                      className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[12px] text-[#34D399] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={passInputId}
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-bold text-[14px] rounded-[8px] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#059669]/30 disabled:opacity-50"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 2. SIGN UP / REGISTER FORM */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {signUpError && (
                  <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#F87171]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{signUpError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="First and last name"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={companyInputId}
                    className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5"
                  >
                    Company / Organisation Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={companyInputId}
                      type="text"
                      required
                      value={signUpCompany}
                      onChange={(e) => setSignUpCompany(e.target.value)}
                      placeholder="e.g. Acme Corp Ltd"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Password (8+ characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    Per SOP-01: You will be registered as Owner of the company with full admin permissions.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-bold text-[14px] rounded-[8px] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#059669]/30 disabled:opacity-50"
                >
                  <span>Register Organisation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD VIEW */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                {forgotSent ? (
                  <div className="p-4 bg-[#059669]/10 border border-[#059669]/30 rounded-[8px] space-y-2">
                    <div className="flex items-center gap-2 text-[#34D399] font-bold text-[14px]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Password reset email dispatched</span>
                    </div>
                    <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                      Per SOP-02 Step 3, a secure reset link has been dispatched to{' '}
                      <strong className="text-[#F8FAFC]">{forgotEmail}</strong>. Follow the instructions in
                      the message to choose a new password.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signin');
                        setForgotSent(false);
                      }}
                      className="mt-2 text-[12px] font-semibold text-[#34D399] hover:underline"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    {forgotError && (
                      <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#F87171]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{forgotError}</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setTab('signin')}
                        className="text-[13px] text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        Back to sign in
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-bold text-[13px] rounded-[8px] transition-colors"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="px-6 py-4 border-t border-[#1E293B] text-center text-[12px] text-[#94A3B8]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Calculations only. Nothing is posted to the ledger.</span>
          <span className="text-[#64748B]">CerosL1 Web Authentication Gateway</span>
        </div>
      </footer>
    </div>
  );
};
