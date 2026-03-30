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
    // Load companion from storage
    const companionData = StorageService.getSessionItem<CompanionData>(STORAGE_KEYS.COMPANION);

    if (!companionData) {
      console.warn('[ChatPage] No companion in session storage, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }

    // Check for auth token
    const storedToken = StorageService.getSessionItem<string>(STORAGE_KEYS.AUTH_TOKEN);
    if (!storedToken) {
      console.warn('[ChatPage] No auth token, redirecting to signup');
      router.push('/onboarding/signup');
      return;
    }

    console.log('[ChatPage] Loaded companion:', companionData.name, 'id:', companionData.id);
    setCompanion(companionData);
    setIsLoading(false);
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
