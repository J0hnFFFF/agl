import { renderHook, act } from '@testing-library/react';
import { useAvatarState } from '../src/hooks/useAvatarState';

describe('useAvatarState', () => {
  it('should initialize with default neutral emotion', () => {
    const { result } = renderHook(() => useAvatarState());

    expect(result.current.avatarState.emotion).toBe('neutral');
    expect(result.current.avatarState.intensity).toBe(0.5);
    expect(result.current.avatarState.isSpeaking).toBe(false);
    expect(result.current.avatarState.isIdle).toBe(true);
  });

  it('should initialize with custom emotion', () => {
    const { result } = renderHook(() => useAvatarState('happy'));

    expect(result.current.avatarState.emotion).toBe('happy');
  });

  it('should update emotion', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setEmotion('excited');
    });

    expect(result.current.avatarState.emotion).toBe('excited');
    expect(result.current.avatarState.isIdle).toBe(false);
  });

  it('should update emotion with intensity', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setEmotion('angry', 0.8);
    });

    expect(result.current.avatarState.emotion).toBe('angry');
    expect(result.current.avatarState.intensity).toBe(0.8);
  });

  it('should update intensity only', () => {
    const { result } = renderHook(() => useAvatarState('happy'));

    act(() => {
      result.current.setIntensity(0.9);
    });

    expect(result.current.avatarState.emotion).toBe('happy');
    expect(result.current.avatarState.intensity).toBe(0.9);
  });

  it('should clamp intensity between 0 and 1', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setIntensity(1.5);
    });
    expect(result.current.avatarState.intensity).toBe(1);

    act(() => {
      result.current.setIntensity(-0.5);
    });
    expect(result.current.avatarState.intensity).toBe(0);
  });

  it('should update speaking state', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setSpeaking(true);
    });

    expect(result.current.avatarState.isSpeaking).toBe(true);
    expect(result.current.avatarState.isIdle).toBe(false);
  });

  it('should update idle state', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setIdle(false);
    });

    expect(result.current.avatarState.isIdle).toBe(false);
  });

  it('should play animation', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.playAnimation('jump');
    });

    expect(result.current.avatarState.currentAnimation).toBe('jump');
    expect(result.current.avatarState.isIdle).toBe(false);
  });

  it('should get animation config for current emotion', () => {
    const { result } = renderHook(() => useAvatarState('happy'));

    const animConfig = result.current.getCurrentAnimationConfig();

    expect(animConfig).not.toBeNull();
    expect(animConfig?.name).toBeDefined();
    expect(animConfig?.duration).toBeGreaterThan(0);
  });

  it('should reset to idle after animation completes', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.playAnimation('celebrate');
    });

    expect(result.current.avatarState.currentAnimation).toBe('celebrate');
    expect(result.current.avatarState.isIdle).toBe(false);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.avatarState.currentAnimation).toBeUndefined();
    expect(result.current.avatarState.isIdle).toBe(true);

    jest.useRealTimers();
  });

  it('should not reset to idle if speaking', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.playAnimation('laugh');
      result.current.setSpeaking(true);
    });

    expect(result.current.avatarState.currentAnimation).toBe('laugh');
    expect(result.current.avatarState.isSpeaking).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should still have the animation because speaking
    expect(result.current.avatarState.isSpeaking).toBe(true);

    jest.useRealTimers();
  });

  it('should handle rapid emotion changes', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setEmotion('happy');
      result.current.setEmotion('sad');
      result.current.setEmotion('excited');
    });

    expect(result.current.avatarState.emotion).toBe('excited');
  });

  it('should handle rapid intensity changes', () => {
    const { result } = renderHook(() => useAvatarState());

    act(() => {
      result.current.setIntensity(0.2);
      result.current.setIntensity(0.5);
      result.current.setIntensity(0.9);
    });

    expect(result.current.avatarState.intensity).toBe(0.9);
  });
});
