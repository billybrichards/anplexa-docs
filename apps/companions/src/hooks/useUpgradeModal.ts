import { useState, useCallback } from 'react';

export interface UseUpgradeModalOptions {
  messageLimit?: number;
  guestMessageCount?: number;
}

export interface UseUpgradeModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  shouldShow: boolean;
  trigger: (reason: string) => void;
  triggerReason?: string;
}

const DEFAULT_MESSAGE_LIMIT = 10;

/**
 * Hook for managing upgrade modal state
 * Handles modal visibility, trigger conditions, and user interaction
 */
export function useUpgradeModal(
  options?: UseUpgradeModalOptions
): UseUpgradeModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState<string>();

  const messageLimit = options?.messageLimit ?? DEFAULT_MESSAGE_LIMIT;
  const guestMessageCount = options?.guestMessageCount ?? 0;

  // Check if modal should be shown based on message limit
  const shouldShowModal = useCallback(() => {
    return guestMessageCount >= messageLimit;
  }, [guestMessageCount, messageLimit]);

  // Open the modal
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close the modal
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Trigger modal with a specific reason
  const trigger = useCallback((reason: string) => {
    setTriggerReason(reason);
    if (shouldShowModal()) {
      setIsOpen(true);
    }
  }, [shouldShowModal]);

  return {
    isOpen,
    open,
    close,
    shouldShow: shouldShowModal(),
    trigger,
    triggerReason,
  };
}
