'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';
import { StorageService, STORAGE_KEYS } from '@/lib/storage/StorageService';

interface CompanionData {
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
      // No companion - redirect to onboarding
      router.push('/onboarding');
      return;
    }

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

  return (
    <div className="min-h-screen bg-deep-space">
      <ChatInterface
        companionName={companion.name}
        companionPersonaId={(companion as any).id}
        userId={(companion as any).userId || 'guest'}
      />
    </div>
  );
}
