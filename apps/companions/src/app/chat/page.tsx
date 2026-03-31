'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';
import { StorageService, STORAGE_KEYS } from '@/lib/storage/StorageService';

interface CompanionData {
  id: string;
  name: string;
  personality: string[];
  communicationStyle: string;
  specializations: string[];
}

/**
 * ChatPage - Main chat interface with AI companion
 *
 * Loads companion data from session storage and renders the chat interface.
 * If no companion exists, redirects to onboarding to create one.
 *
 * The companion's personality traits and communication style are used to
 * generate personalized system prompts via the SendMessageUseCase.
 */
export default function ChatPage() {
  const router = useRouter();
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompanion = async () => {
      // Check for auth token first
      const storedToken = StorageService.getSessionItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      if (!storedToken) {
        console.warn('[ChatPage] No auth token, redirecting to signup');
        router.push('/onboarding/signup');
        return;
      }

      // Try loading companion from session storage (onboarding flow)
      const companionData = StorageService.getSessionItem<CompanionData>(STORAGE_KEYS.COMPANION);
      if (companionData) {
        console.log('[ChatPage] Loaded companion from storage:', companionData.name, 'id:', companionData.id);
        setCompanion(companionData);
        setIsLoading(false);
        return;
      }

      // No companion in storage — returning user. Fetch from API.
      console.log('[ChatPage] No companion in storage, fetching active companion from API...');
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const res = await fetch(`${apiBase}/api/companion/active`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const fetchedCompanion: CompanionData = {
            id: data.id,
            name: data.name,
            personality: data.personality || [],
            communicationStyle: data.communicationStyle || '',
            specializations: [],
          };
          StorageService.setSessionItem(STORAGE_KEYS.COMPANION, fetchedCompanion);
          console.log('[ChatPage] Fetched active companion from API:', fetchedCompanion.name);
          setCompanion(fetchedCompanion);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[ChatPage] Failed to fetch active companion:', err);
      }

      // No companion anywhere — redirect to onboarding
      console.warn('[ChatPage] No companion found, redirecting to onboarding');
      router.push('/onboarding');
    };

    loadCompanion();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="text-cream text-lg">Loading your companion...</p>
        </div>
      </div>
    );
  }

  if (!companion) {
    return null; // Will redirect via useEffect
  }

  const token = StorageService.getSessionItem<string>(STORAGE_KEYS.AUTH_TOKEN);

  return (
    <div className="min-h-screen bg-deep-space">
      <ChatInterface
        companionName={companion.name}
        companionPersonaId={companion.id}
        token={token || undefined}
      />
    </div>
  );
}
