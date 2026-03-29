'use client';

import Link from 'next/link';
import { KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** Match Supabase `otp_expiry` (e.g. 120 seconds) for the visible countdown. */
const CODE_VALID_SECONDS = 120;

type Step = 'email' | 'verify' | 'password';

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ForgotPassword() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_VALID_SECONDS);
  const [resendKey, setResendKey] = useState(0);

  useEffect(() => {
    if (!loading && user && step === 'email') {
      router.push('/');
    }
  }, [user, loading, router, step]);

  useEffect(() => {
    if (step !== 'verify') return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendKey]);

  const startVerifyCountdown = useCallback(() => {
    setSecondsLeft(CODE_VALID_SECONDS);
    setResendKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user && step === 'email') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fallback =
          res.status === 429
            ? 'Too many reset emails were sent recently. Please wait a few minutes and try again.'
            : 'Something went wrong. Please try again.';
        setError(data.error || fallback);
        return;
      }

      startVerifyCountdown();
      setStep('verify');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customers/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not resend the code. Try again later.');
        return;
      }
      startVerifyCountdown();
    } catch {
      setError('Could not resend the code. Try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  const verifyCodeOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otp.trim().replace(/\s/g, '');
    if (code.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'recovery',
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      setStep('password');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePasswordOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      router.push('/auth/signin?reset=success');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = async () => {
    setError('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    if (step === 'password') {
      await supabase.auth.signOut();
    }
    setStep('email');
  };

  const title =
    step === 'email'
      ? 'Reset your password'
      : step === 'verify'
        ? 'Enter verification code'
        : 'Choose a new password';

  const subtitle =
    step === 'email'
      ? 'We will email you a 6-digit code to confirm it is you.'
      : step === 'verify'
        ? `We sent a code to ${email.trim()}. Enter it before the time runs out.`
        : 'Your code is confirmed. Set a new password for your account.';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
            {step === 'verify' && (
              <div className="mt-4 inline-flex items-center rounded-lg bg-primary-50 border border-primary-100 px-4 py-2">
                <span className="text-sm font-medium text-primary-800">
                  {secondsLeft > 0 ? (
                    <>Code expires in {formatMmSs(secondsLeft)}</>
                  ) : (
                    <>Time expired — request a new code</>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
            {step === 'email' && (
              <form onSubmit={sendCode} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending…' : 'Send code'}
                </button>

                <div className="text-center">
                  <Link
                    href="/auth/signin"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={verifyCodeOnly} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    6-digit code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={12}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^\d\s]/g, ''));
                      if (error) setError('');
                    }}
                    className="input-field tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying…' : 'Verify code'}
                </button>

                <div className="flex flex-col gap-2 text-center text-sm">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resendLoading}
                    className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending…' : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Use a different email
                  </button>
                  <Link
                    href="/auth/signin"
                    className="font-medium text-primary-600 hover:text-primary-700 inline-flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={updatePasswordOnly} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className="input-field pr-10"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="input-field"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving…' : 'Update password'}
                </button>

                <div className="flex flex-col gap-2 text-center text-sm">
                  <button type="button" onClick={goBackToEmail} className="text-gray-600 hover:text-gray-800">
                    Start over
                  </button>
                  <Link
                    href="/auth/signin"
                    className="font-medium text-primary-600 hover:text-primary-700 inline-flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
