/**
 * useFunnelSession Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useFunnelSession } from '../useFunnelSession';
import type { FunnelQuestion } from '../../types';

const mockSteps: FunnelQuestion[] = [
  {
    id: 'q1',
    text: 'Question 1?',
    options: [
      { text: 'Option A', emoji: '😊' },
      { text: 'Option B', emoji: '😢' },
    ],
  },
  {
    id: 'q2',
    text: 'Question 2?',
    options: [
      { text: 'Option C', emoji: '😎' },
      { text: 'Option D', emoji: '🤔' },
    ],
  },
  {
    id: 'q3',
    text: 'Question 3?',
    options: [
      { text: 'Option E', emoji: '❤️' },
      { text: 'Option F', emoji: '🚀' },
    ],
  },
];

describe('useFunnelSession', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(3);
      expect(result.current.progress).toBe(33);
      expect(result.current.responses).toEqual({});
      expect(result.current.persona).toBeUndefined();
      expect(result.current.email).toBeUndefined();
      expect(result.current.sessionId).toBeDefined();
    });

    test('should restore state from sessionStorage', () => {
      const savedState = {
        currentStep: 1,
        responses: { q1: 'Option A' },
        persona: 'A',
        email: 'test@example.com',
        sessionId: 'test-session-123',
      };

      sessionStorage.setItem('funnel_session', JSON.stringify(savedState));

      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.currentStep).toBe(1);
      expect(result.current.responses).toEqual({ q1: 'Option A' });
      expect(result.current.persona).toBe('A');
      expect(result.current.email).toBe('test@example.com');
      expect(result.current.sessionId).toBe('test-session-123');
    });

    test('should generate unique sessionId', () => {
      const { result: result1 } = renderHook(() => useFunnelSession(mockSteps));
      const { result: result2 } = renderHook(() => useFunnelSession(mockSteps));

      expect(result1.current.sessionId).toBeDefined();
      expect(result2.current.sessionId).toBeDefined();
    });
  });

  describe('Navigation', () => {
    test('goNext() should advance to next step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.goNext();
      });

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.goNext();
      });

      expect(result.current.currentStep).toBe(2);
    });

    test('goNext() should not exceed total steps', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goNext();
        result.current.goNext();
        result.current.goNext();
        result.current.goNext();
      });

      expect(result.current.currentStep).toBe(2);
    });

    test('goPrevious() should go back to previous step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goNext();
        result.current.goNext();
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.goPrevious();
      });

      expect(result.current.currentStep).toBe(1);
    });

    test('goPrevious() should not go below 0', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goPrevious();
        result.current.goPrevious();
      });

      expect(result.current.currentStep).toBe(0);
    });

    test('goToStep() should jump to specific step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.goToStep(0);
      });

      expect(result.current.currentStep).toBe(0);
    });

    test('goToStep() should not allow invalid steps', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goToStep(-1);
      });

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.goToStep(10);
      });

      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('Response Recording', () => {
    test('recordResponse() should store response for step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.recordResponse('q1', 'Option A');
      });

      expect(result.current.responses).toEqual({ q1: 'Option A' });

      act(() => {
        result.current.recordResponse('q2', 'Option C');
      });

      expect(result.current.responses).toEqual({
        q1: 'Option A',
        q2: 'Option C',
      });
    });

    test('recordResponse() should overwrite existing response', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.recordResponse('q1', 'Option A');
        result.current.recordResponse('q1', 'Option B');
      });

      expect(result.current.responses).toEqual({ q1: 'Option B' });
    });
  });

  describe('Persona and Email', () => {
    test('setPersona() should set persona', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.setPersona('A');
      });

      expect(result.current.persona).toBe('A');

      act(() => {
        result.current.setPersona('B');
      });

      expect(result.current.persona).toBe('B');
    });

    test('setEmail() should set email', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.setEmail('user@example.com');
      });

      expect(result.current.email).toBe('user@example.com');
    });
  });

  describe('Progress Calculation', () => {
    test('should calculate progress percentage correctly', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.progress).toBe(33); // 1/3 * 100 ≈ 33

      act(() => {
        result.current.goNext();
      });

      expect(result.current.progress).toBe(67); // 2/3 * 100 ≈ 67

      act(() => {
        result.current.goNext();
      });

      expect(result.current.progress).toBe(100); // 3/3 * 100 = 100
    });
  });

  describe('Utility Methods', () => {
    test('isFirstStep() should return true on first step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.isFirstStep()).toBe(true);

      act(() => {
        result.current.goNext();
      });

      expect(result.current.isFirstStep()).toBe(false);
    });

    test('isLastStep() should return true on last step', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      expect(result.current.isLastStep()).toBe(false);

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.isLastStep()).toBe(true);
    });
  });

  describe('Reset', () => {
    test('resetSession() should clear all state', () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.goToStep(2);
        result.current.recordResponse('q1', 'Option A');
        result.current.setPersona('A');
        result.current.setEmail('test@example.com');
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.responses).toEqual({ q1: 'Option A' });
      expect(result.current.persona).toBe('A');
      expect(result.current.email).toBe('test@example.com');

      act(() => {
        result.current.resetSession();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.responses).toEqual({});
      expect(result.current.persona).toBeUndefined();
      expect(result.current.email).toBeUndefined();
    });

    test('resetSession() should clear sessionStorage', async () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.recordResponse('q1', 'Option A');
      });

      sessionStorage.setItem('funnel_session', JSON.stringify({ test: true }));

      act(() => {
        result.current.resetSession();
      });

      // Give effect time to run and persist reset state
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = sessionStorage.getItem('funnel_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.currentStep).toBe(0);
        expect(parsed.responses).toEqual({});
      }
    });
  });

  describe('SessionStorage Persistence', () => {
    test('should persist state to sessionStorage on changes', async () => {
      const { result } = renderHook(() => useFunnelSession(mockSteps));

      act(() => {
        result.current.recordResponse('q1', 'Option A');
        result.current.goNext();
      });

      // Give effect time to run
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = sessionStorage.getItem('funnel_session');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.currentStep).toBe(1);
      expect(parsed.responses).toEqual({ q1: 'Option A' });
    });
  });
});
