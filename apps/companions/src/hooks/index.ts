export { usePreferences } from './usePreferences';
export type { CompanionPreferences, UsePreferencesReturn } from './usePreferences';

export { useUpgradeModal } from './useUpgradeModal';
export type { UseUpgradeModalOptions, UseUpgradeModalReturn } from './useUpgradeModal';

export { useMessagePersistence } from './useMessagePersistence';
export type {
  UseMessagePersistenceOptions,
  UseMessagePersistenceReturn,
} from './useMessagePersistence';

export { useGuestChat } from './useGuestChat';
export type {
  UseGuestChatOptions,
  UseGuestChatReturn,
} from './useGuestChat';

export { useChat } from './useChat';
export type { UseChatOptions } from './useChat';

export { useLiveKit } from './useLiveKit';
export type { UseLiveKitOptions, UseLiveKitReturn } from './useLiveKit';

// Re-export domain entities from @anplexa/core for convenience
export type { Message, Conversation } from '@anplexa/core/domain/entities';
