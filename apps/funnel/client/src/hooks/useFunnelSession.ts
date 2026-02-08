/**
 * useFunnelSession Hook
 *
 * Manages funnel step navigation, user responses, and session state.
 * Handles local storage persistence for session recovery on page refresh.
 */

import { useState, useCallback, useEffect } from 'react';
import type { FunnelQuestion, Persona } from '../types';

const SESSION_STORAGE_KEY = 'funnel_session';

export interface UseFunnelSessionReturn {
  // State
  currentStep: number;
  totalSteps: number;
  progress: number;
  responses: Record<string, string>;
  persona?: Persona;
  email?: string;
  sessionId: string;

  // Navigation
  goNext: () => void;
  goPrevious: () => void;
  goToStep: (step: number) => void;

  // Data Management
  recordResponse: (stepId: string, response: string) => void;
  setPersona: (persona: Persona) => void;
  setEmail: (email: string) => void;
  resetSession: () => void;

  // Utilities
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
}

interface StoredSessionState {
  currentStep: number;
  responses: Record<string, string>;
  persona?: Persona;
  email?: string;
  sessionId: string;
}

/**
 * Hook for managing funnel session state and navigation
 * @param steps - Array of funnel steps/questions
 * @returns Session state and navigation methods
 */
export function useFunnelSession(steps: FunnelQuestion[]): UseFunnelSessionReturn {
  const totalSteps = steps.length;

  // Initialize session ID and state from localStorage
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return crypto.randomUUID?.() || Math.random().toString(36);
    }
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSessionState;
      return parsed.sessionId;
    }
    return crypto.randomUUID?.() || Math.random().toString(36);
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSessionState;
      return parsed.currentStep;
    }
    return 0;
  });

  const [responses, setResponses] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSessionState;
      return parsed.responses;
    }
    return {};
  });

  const [persona, setPersonaState] = useState<Persona | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSessionState;
      return parsed.persona;
    }
    return undefined;
  });

  const [email, setEmailState] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSessionState;
      return parsed.email;
    }
    return undefined;
  });

  // Persist state to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stateToStore: StoredSessionState = {
      currentStep,
      responses,
      persona,
      email,
      sessionId,
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToStore));
  }, [currentStep, responses, persona, email, sessionId]);

  // Calculate progress percentage
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  // Data management
  const recordResponse = useCallback((stepId: string, response: string) => {
    setResponses((prev) => ({
      ...prev,
      [stepId]: response,
    }));
  }, []);

  const setPersona = useCallback((newPersona: Persona) => {
    setPersonaState(newPersona);
  }, []);

  const setEmail = useCallback((newEmail: string) => {
    setEmailState(newEmail);
  }, []);

  const resetSession = useCallback(() => {
    setCurrentStep(0);
    setResponses({});
    setPersonaState(undefined);
    setEmailState(undefined);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  // Utilities
  const isLastStep = useCallback(() => currentStep === totalSteps - 1, [currentStep, totalSteps]);
  const isFirstStep = useCallback(() => currentStep === 0, [currentStep]);

  return {
    currentStep,
    totalSteps,
    progress,
    responses,
    persona,
    email,
    sessionId,
    goNext,
    goPrevious,
    goToStep,
    recordResponse,
    setPersona,
    setEmail,
    resetSession,
    isLastStep,
    isFirstStep,
  };
}
