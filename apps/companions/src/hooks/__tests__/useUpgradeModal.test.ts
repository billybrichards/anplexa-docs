import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpgradeModal } from '../useUpgradeModal';

describe('useUpgradeModal', () => {
  beforeEach(() => {
    // Clear any state
  });

  it('should initialize with modal closed', () => {
    const { result } = renderHook(() => useUpgradeModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('should open the modal', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close the modal', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should trigger modal with a reason', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.trigger('exceeded_message_limit');
    });

    expect(result.current.triggerReason).toBe('exceeded_message_limit');
  });

  it('should show modal when message limit is reached', () => {
    const { result } = renderHook(() =>
      useUpgradeModal({
        messageLimit: 5,
        guestMessageCount: 5,
      })
    );

    expect(result.current.shouldShow).toBe(true);
  });

  it('should not show modal when under message limit', () => {
    const { result } = renderHook(() =>
      useUpgradeModal({
        messageLimit: 10,
        guestMessageCount: 5,
      })
    );

    expect(result.current.shouldShow).toBe(false);
  });

  it('should use default message limit when not provided', () => {
    const { result } = renderHook(() =>
      useUpgradeModal({
        guestMessageCount: 10,
      })
    );

    expect(result.current.shouldShow).toBe(true);
  });

  it('should handle trigger when limit is reached', () => {
    const { result } = renderHook(() =>
      useUpgradeModal({
        messageLimit: 5,
        guestMessageCount: 5,
      })
    );

    act(() => {
      result.current.trigger('message_limit_reached');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.triggerReason).toBe('message_limit_reached');
  });

  it('should not open modal on trigger when shouldShow is false', () => {
    const { result } = renderHook(() =>
      useUpgradeModal({
        messageLimit: 5,
        guestMessageCount: 3,
      })
    );

    act(() => {
      result.current.trigger('user_request');
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should maintain state across multiple opens and closes', () => {
    const { result } = renderHook(() => useUpgradeModal());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });
});
