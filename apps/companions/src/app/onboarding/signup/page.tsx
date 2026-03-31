'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody, CosmicCardFooter } from '@/components/CosmicCard';
import { CosmicInput } from '@/components/CosmicInput';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS } from '@/lib/storage/StorageService';
import { API_BASE_URL } from '@/lib/config';

type Step = 'signup' | 'verify';

interface AuthData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  const handleSignup = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Register the user
      const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || 'Registration failed');
        return;
      }

      const auth: AuthData = {
        userId: registerData.user.id,
        email,
        accessToken: registerData.accessToken,
        refreshToken: registerData.refreshToken,
      };
      setAuthData(auth);

      // Send verification code
      const verifyRes = await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.userId, email }),
      });

      if (!verifyRes.ok) {
        // Registration succeeded but verification email failed — still move to verify step
        console.warn('[Signup] Failed to send verification email');
      }

      setStep('verify');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!authData) return;
    setError('');

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.userId, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      // Store auth tokens and navigate to chat
      StorageService.setSessionItem(STORAGE_KEYS.AUTH_TOKEN, authData.accessToken);
      StorageService.setSessionItem(STORAGE_KEYS.AUTH_USER, {
        id: authData.userId,
        email: authData.email,
      });

      router.push('/chat');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!authData) return;
    setError('');
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.userId, email: authData.email }),
      });
      setError('');
    } catch {
      setError('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const [companion, setCompanion] = useState<{ name: string } | null>(null);

  // Read companion from sessionStorage only in the browser (not during SSR/prerender)
  useEffect(() => {
    setCompanion(StorageService.getSessionItem<{ name: string }>(STORAGE_KEYS.COMPANION));
  }, []);

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden px-6 py-12">
      <Starfield />

      <div className="relative z-10 max-w-md mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-4">
          <SectionLabel className="animate-fade-in">Final Step</SectionLabel>

          <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight">
            {step === 'signup' ? (
              <>
                Create Your{' '}
                <span className="text-gold">Account</span>
              </>
            ) : (
              <>
                Verify Your{' '}
                <span className="text-gold">Email</span>
              </>
            )}
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            {step === 'signup'
              ? `Sign up to start chatting with ${companion?.name || 'your companion'}`
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CosmicCardBody className="p-8 space-y-6">
            {step === 'signup' ? (
              <>
                <CosmicInput
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error && error.toLowerCase().includes('email') ? error : undefined}
                />

                <CosmicInput
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error && error.toLowerCase().includes('password') ? error : undefined}
                />

                <CosmicInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
              </>
            ) : (
              <>
                <CosmicInput
                  label="Verification Code"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(val);
                  }}
                  className="text-center text-2xl tracking-widest"
                />

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-gold/70 hover:text-gold transition-colors underline"
                >
                  Resend code
                </button>
              </>
            )}
          </CosmicCardBody>

          <CosmicCardFooter className="p-8 pt-0">
            <CosmicButton
              variant="primary"
              size="lg"
              loading={isLoading}
              onClick={step === 'signup' ? handleSignup : handleVerify}
              className="w-full"
            >
              {step === 'signup' ? 'Create Account' : 'Verify & Start Chatting'}
            </CosmicButton>
          </CosmicCardFooter>
        </CosmicCard>

        <div className="text-center">
          <p className="text-xs text-text-muted">
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
}
