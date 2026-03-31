'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody, CosmicCardFooter } from '@/components/CosmicCard';
import { CosmicInput } from '@/components/CosmicInput';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS } from '@/lib/storage/StorageService';
import { API_BASE_URL } from '@/lib/config';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      // Store auth tokens
      StorageService.setSessionItem(STORAGE_KEYS.AUTH_TOKEN, data.accessToken);
      StorageService.setSessionItem(STORAGE_KEYS.AUTH_USER, {
        id: data.user.id,
        email: data.user.email,
      });

      router.push('/chat');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignIn();
    }
  };

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden px-6 py-12">
      <Starfield />

      <div className="relative z-10 max-w-md mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-4">
          <SectionLabel className="animate-fade-in">Welcome Back</SectionLabel>

          <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight">
            Sign In to{' '}
            <span className="text-gold">Anplexa</span>
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Pick up where you left off with your companion
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CosmicCardBody className="p-8 space-y-6">
            <CosmicInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              error={error && error.toLowerCase().includes('email') ? error : undefined}
            />

            <CosmicInput
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              error={error && error.toLowerCase().includes('password') ? error : undefined}
            />

            {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </CosmicCardBody>

          <CosmicCardFooter className="p-8 pt-0 space-y-4">
            <CosmicButton
              variant="primary"
              size="lg"
              loading={isLoading}
              onClick={handleSignIn}
              className="w-full"
            >
              Sign In
            </CosmicButton>
          </CosmicCardFooter>
        </CosmicCard>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/onboarding/birth-data" className="text-gold/80 hover:text-gold transition-colors underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
