import React, { useState, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { CerosLogo } from '../CerosLogo';
import { LegalModal, type LegalDoc } from '../LegalModal';
import {
  Lock,
  AtSign,
  Mail,
  Building,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

const inputClass =
  'w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-[8px] text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#059669] focus:ring-3 focus:ring-[#059669]/20 transition-all';
const labelClass = 'block text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5';
const iconClass = 'w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2';
const primaryButtonClass =
  'w-full mt-2 py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-bold text-[14px] rounded-[8px] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#059669]/30 disabled:opacity-50';

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#F87171]">
    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
    <span>{message}</span>
  </div>
);

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, authNotice } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const legalLink = 'text-[#34D399] hover:underline';

  // Sign In
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpNotice, setSignUpNotice] = useState<string | null>(null);

  const usernameInputId = useId();
  const passInputId = useId();
  const nameInputId = useId();
  const companyInputId = useId();
  const newUsernameInputId = useId();
  const newEmailInputId = useId();
  const newPassInputId = useId();

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsSubmitting(true);
    try {
      const res = await signIn(signInUsername, signInPassword);
      if (!res.success && res.error) setSignInError(res.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpNotice(null);
    setIsSubmitting(true);
    try {
      const res = await signUp({
        name: signUpName,
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
        companyName: signUpCompany
      });
      if (!res.success && res.error) setSignUpError(res.error);
      if (res.success && res.notice) setSignUpNotice(res.notice);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#059669] selection:text-white antialiased">
      {/* Top Bar */}
      <header className="px-6 py-5 border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CerosLogo size={32} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[18px] tracking-tight text-[#F8FAFC]">CerosL1</span>
            <span className="text-[12px] font-semibold text-[#34D399] tracking-normal">Ledger &amp; Calculator</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#94A3B8]">
          <span>Executive Modernist Accounting</span>
        </div>
      </header>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[460px] bg-[#111B2E] border border-[#1E293B] rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="p-6 pb-4 border-b border-[#1E293B]">
            <div className="flex items-center justify-between mb-4">
              <CerosLogo size={40} />
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#34D399] bg-[#059669]/10 border border-[#059669]/20 px-2.5 py-1 rounded-full">
                Secure Access
              </span>
            </div>

            <h1 className="text-[22px] font-bold tracking-tight text-[#F8FAFC]">
              {tab === 'signin' && 'Sign in to CerosL1'}
              {tab === 'signup' && 'Create a client account'}
              {tab === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-1 leading-relaxed">
              {tab === 'signin' && 'Sign in with your CerosL1 username and password.'}
              {tab === 'signup' && 'Register to use the CerosL1 calculators for your business.'}
              {tab === 'forgot' && 'Passwords are reset by your CerosL1 administrator.'}
            </p>

            {tab !== 'forgot' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0F172A] border border-[#1E293B] rounded-[8px] mt-4">
                {(['signin', 'signup'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setSignInError(null);
                      setSignUpError(null);
                    }}
                    className={`py-2 text-[13px] font-semibold rounded-[6px] transition-all text-center ${
                      tab === t ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {t === 'signin' ? 'Sign in' : 'Create an account'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 space-y-5">
            {!isSupabaseConfigured && (
              <div className="p-3 bg-[#D97706]/10 border border-[#D97706]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#FBBF24]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The database is not connected. Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>, then rebuild the app.
                </span>
              </div>
            )}

            {/* SIGN IN */}
            {tab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {(signInError || authNotice) && <ErrorBox message={(signInError || authNotice) as string} />}

                <div>
                  <label htmlFor={usernameInputId} className={labelClass}>
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className={iconClass} />
                    <input
                      id={usernameInputId}
                      type="text"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={signInUsername}
                      onChange={(e) => setSignInUsername(e.target.value)}
                      placeholder="Your username"
                      className={inputClass}
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
                    <Lock className={iconClass} />
                    <input
                      id={passInputId}
                      type="password"
                      required
                      autoComplete="current-password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Your password"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className={primaryButtonClass}>
                  <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* SIGN UP (always creates a client account) */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {signUpError && <ErrorBox message={signUpError} />}
                {signUpNotice && (
                  <div className="p-3 bg-[#059669]/10 border border-[#059669]/30 rounded-[8px] flex items-start gap-2.5 text-[12px] text-[#34D399]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{signUpNotice}</span>
                  </div>
                )}

                <div>
                  <label htmlFor={nameInputId} className={labelClass}>
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className={iconClass} />
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      autoComplete="name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="First and last name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={companyInputId} className={labelClass}>
                    Company / Organisation Name
                  </label>
                  <div className="relative">
                    <Building className={iconClass} />
                    <input
                      id={companyInputId}
                      type="text"
                      required
                      autoComplete="organization"
                      value={signUpCompany}
                      onChange={(e) => setSignUpCompany(e.target.value)}
                      placeholder="Your company's registered name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={newEmailInputId} className={labelClass}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={iconClass} />
                    <input
                      id={newEmailInputId}
                      type="email"
                      required
                      autoComplete="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="name@company.com"
                      className={inputClass}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    For contact from your administrator. You sign in with your username.
                  </p>
                </div>

                <div>
                  <label htmlFor={newUsernameInputId} className={labelClass}>
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className={iconClass} />
                    <input
                      id={newUsernameInputId}
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      placeholder="3–30 characters"
                      className={inputClass}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#94A3B8]">
                    Letters, numbers, spaces, dots, dashes or underscores. Not case-sensitive.
                  </p>
                </div>

                <div>
                  <label htmlFor={newPassInputId} className={labelClass}>
                    Password (8+ characters)
                  </label>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input
                      id={newPassInputId}
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className={primaryButtonClass}>
                  <span>{isSubmitting ? 'Creating account…' : 'Create client account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-[#94A3B8] text-center leading-relaxed">
                  By creating an account, you agree to the{' '}
                  <button type="button" onClick={() => setLegalDoc('terms')} className={legalLink}>
                    Terms and Conditions
                  </button>{' '}
                  and{' '}
                  <button type="button" onClick={() => setLegalDoc('privacy')} className={legalLink}>
                    Privacy Policy
                  </button>
                  .
                </p>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-[8px] space-y-2 text-[13px] text-[#94A3B8] leading-relaxed">
                  <p>
                    CerosL1 accounts use a username instead of an email address, so a reset link cannot be sent
                    automatically.
                  </p>
                  <p>
                    Contact your <strong className="text-[#F8FAFC]">CerosL1 administrator</strong> with your username.
                    They will set a temporary password that you can change after signing in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-[13px] font-semibold text-[#34D399] hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 border-t border-[#1E293B] text-center text-[12px] text-[#94A3B8]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Calculations only. Nothing is posted to the ledger.</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setLegalDoc('terms')} className="hover:text-[#F8FAFC] hover:underline">
              Terms and Conditions
            </button>
            <span className="text-[#334155]">|</span>
            <button type="button" onClick={() => setLegalDoc('privacy')} className="hover:text-[#F8FAFC] hover:underline">
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} onSwitch={setLegalDoc} />}
    </div>
  );
};
