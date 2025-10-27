import React, { useState, useCallback, useEffect } from 'react';
import { AvatarRenderer } from './AvatarRenderer';
import { EmotionWheel } from './EmotionWheel';
import { BubbleTooltip } from './BubbleTooltip';
import type {
  AvatarConfig,
  AvatarState,
  EmotionType,
  RendererOptions,
  AvatarEventHandlers,
  EmotionWheelPosition,
  BubbleConfig,
  VisibilityMode,
} from '../types';

/**
 * Props for AvatarController
 */
export interface AvatarControllerProps {
  /** Avatar configuration */
  config: AvatarConfig;
  /** Renderer options */
  rendererOptions?: RendererOptions;
  /** Show emotion wheel */
  showEmotionWheel?: boolean;
  /** Emotion wheel position */
  emotionWheelPosition?: EmotionWheelPosition;
  /** Bubble tooltip configuration */
  bubbleConfig?: BubbleConfig;
  /** Event handlers */
  handlers?: AvatarEventHandlers;
  /** Current dialogue text */
  dialogueText?: string;
  /** Canvas width */
  width?: number | string;
  /** Canvas height */
  height?: number | string;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * AvatarController - Complete avatar control system
 *
 * Manages avatar state, interactions, and UI controls.
 * Combines the 3D renderer with interaction elements.
 *
 * @example
 * ```tsx
 * <AvatarController
 *   config={{
 *     customization: {
 *       character: 'mage',
 *       skin: 'medium',
 *       hairstyle: 'long',
 *       outfit: 'robes'
 *     },
 *     initialEmotion: 'happy',
 *     enableAnimations: true,
 *     enableInteractions: true
 *   }}
 *   showEmotionWheel={true}
 *   emotionWheelPosition="bottom-right"
 *   bubbleConfig={{
 *     enabled: true,
 *     position: 'top',
 *     maxWidth: 300
 *   }}
 *   dialogueText="Hello! How are you?"
 *   handlers={{
 *     onEmotionChange: (emotion, intensity) => {
 *       console.log('Emotion changed:', emotion, intensity);
 *     },
 *     onClick: () => {
 *       console.log('Avatar clicked!');
 *     }
 *   }}
 * />
 * ```
 */
export const AvatarController: React.FC<AvatarControllerProps> = ({
  config,
  rendererOptions,
  showEmotionWheel = true,
  emotionWheelPosition = 'bottom-right',
  bubbleConfig,
  handlers,
  dialogueText,
  width = 400,
  height = 600,
  className,
  style,
}) => {
  // Avatar state
  const [avatarState, setAvatarState] = useState<AvatarState>({
    emotion: config.initialEmotion || 'neutral',
    intensity: 0.5,
    isSpeaking: false,
    isIdle: true,
    currentAnimation: undefined,
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Handle emotion change from emotion wheel
  const handleEmotionChange = useCallback(
    (emotion: EmotionType, intensity: number) => {
      setAvatarState((prev) => ({
        ...prev,
        emotion,
        intensity,
        isIdle: false,
      }));

      handlers?.onEmotionChange?.(emotion, intensity);
    },
    [handlers]
  );

  // Handle avatar click
  const handleAvatarClick = useCallback(() => {
    handlers?.onClick?.();
    handlers?.onInteraction?.({
      type: 'click',
      target: 'avatar',
    });
  }, [handlers]);

  // Handle avatar hover
  const handleAvatarHover = useCallback(
    (hovering: boolean) => {
      setIsHovering(hovering);
      handlers?.onHover?.(hovering);
    },
    [handlers]
  );

  // Update speaking state based on dialogue text
  useEffect(() => {
    const wasSpeaking = avatarState.isSpeaking;
    const isSpeaking = !!dialogueText && dialogueText.length > 0;

    if (wasSpeaking !== isSpeaking) {
      setAvatarState((prev) => ({
        ...prev,
        isSpeaking,
        isIdle: !isSpeaking,
      }));

      handlers?.onSpeakingChange?.(isSpeaking);
    }
  }, [dialogueText, avatarState.isSpeaking, handlers]);

  // Manage visibility based on mode
  useEffect(() => {
    const visibilityMode: VisibilityMode = config.visibilityMode || 'always';

    switch (visibilityMode) {
      case 'always':
        setIsVisible(true);
        break;
      case 'hidden':
        setIsVisible(false);
        break;
      case 'combat':
      case 'social':
      case 'custom':
        // These would be controlled by external game state
        // For now, default to visible
        setIsVisible(true);
        break;
    }
  }, [config.visibilityMode]);

  // Get emotion wheel position styles
  const getEmotionWheelStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10,
    };

    switch (emotionWheelPosition) {
      case 'top-left':
        return { ...baseStyle, top: 10, left: 10 };
      case 'top-right':
        return { ...baseStyle, top: 10, right: 10 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 10, left: 10 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 10, right: 10 };
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    ...style,
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={className} style={containerStyle}>
      {/* 3D Avatar Renderer */}
      <div
        onClick={handleAvatarClick}
        onMouseEnter={() => handleAvatarHover(true)}
        onMouseLeave={() => handleAvatarHover(false)}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <AvatarRenderer
          config={config}
          options={rendererOptions}
          width="100%"
          height="100%"
        />
      </div>

      {/* Emotion Wheel */}
      {showEmotionWheel && config.enableInteractions && (
        <div style={getEmotionWheelStyle()}>
          <EmotionWheel
            currentEmotion={avatarState.emotion}
            currentIntensity={avatarState.intensity}
            onEmotionChange={handleEmotionChange}
          />
        </div>
      )}

      {/* Bubble Tooltip */}
      {bubbleConfig?.enabled && dialogueText && (
        <BubbleTooltip
          text={dialogueText}
          position={bubbleConfig.position}
          maxWidth={bubbleConfig.maxWidth}
          autoHideDelay={bubbleConfig.autoHideDelay}
          style={bubbleConfig.style}
        />
      )}

      {/* State indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            fontSize: '10px',
            fontFamily: 'monospace',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        >
          {avatarState.emotion} | {(avatarState.intensity * 100).toFixed(0)}% |{' '}
          {avatarState.isSpeaking ? 'Speaking' : 'Idle'}
        </div>
      )}
    </div>
  );
};

AvatarController.displayName = 'AvatarController';
