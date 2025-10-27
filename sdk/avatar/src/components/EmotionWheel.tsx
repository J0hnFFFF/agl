import React, { useState, useCallback } from 'react';
import type { EmotionType } from '../types';

/**
 * Props for EmotionWheel
 */
export interface EmotionWheelProps {
  /** Current emotion */
  currentEmotion: EmotionType;
  /** Current intensity (0-1) */
  currentIntensity: number;
  /** Callback when emotion changes */
  onEmotionChange: (emotion: EmotionType, intensity: number) => void;
  /** Size of the wheel in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Emotion configuration for the wheel
 */
interface EmotionConfig {
  label: string;
  color: string;
  icon: string;
}

const EMOTIONS: Record<EmotionType, EmotionConfig> = {
  happy: { label: 'Happy', color: '#ffd700', icon: '😊' },
  sad: { label: 'Sad', color: '#4169e1', icon: '😢' },
  angry: { label: 'Angry', color: '#dc143c', icon: '😠' },
  fearful: { label: 'Fearful', color: '#9370db', icon: '😨' },
  disgusted: { label: 'Disgusted', color: '#2e8b57', icon: '🤢' },
  surprised: { label: 'Surprised', color: '#ff8c00', icon: '😮' },
  neutral: { label: 'Neutral', color: '#808080', icon: '😐' },
  excited: { label: 'Excited', color: '#ff69b4', icon: '🤩' },
  proud: { label: 'Proud', color: '#daa520', icon: '😌' },
  confident: { label: 'Confident', color: '#4682b4', icon: '😎' },
  disappointed: { label: 'Disappointed', color: '#778899', icon: '😞' },
  frustrated: { label: 'Frustrated', color: '#cd5c5c', icon: '😤' },
};

/**
 * EmotionWheel - Interactive emotion selector
 *
 * Displays a circular wheel of emotions that users can click to change
 * the avatar's emotional state. Includes intensity slider.
 *
 * @example
 * ```tsx
 * <EmotionWheel
 *   currentEmotion="happy"
 *   currentIntensity={0.7}
 *   onEmotionChange={(emotion, intensity) => {
 *     console.log('New emotion:', emotion, intensity);
 *   }}
 *   size={200}
 * />
 * ```
 */
export const EmotionWheel: React.FC<EmotionWheelProps> = ({
  currentEmotion,
  currentIntensity,
  onEmotionChange,
  size = 180,
  className,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localIntensity, setLocalIntensity] = useState(currentIntensity);

  const emotionList: EmotionType[] = [
    'happy',
    'excited',
    'proud',
    'confident',
    'neutral',
    'surprised',
    'sad',
    'disappointed',
    'frustrated',
    'angry',
    'fearful',
    'disgusted',
  ];

  const handleEmotionClick = useCallback(
    (emotion: EmotionType) => {
      onEmotionChange(emotion, localIntensity);
    },
    [localIntensity, onEmotionChange]
  );

  const handleIntensityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const intensity = parseFloat(event.target.value);
      setLocalIntensity(intensity);
      onEmotionChange(currentEmotion, intensity);
    },
    [currentEmotion, onEmotionChange]
  );

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: isExpanded ? size + 60 : size / 3,
    transition: 'height 0.3s ease',
    ...style,
  };

  const currentConfig = EMOTIONS[currentEmotion];

  return (
    <div className={className} style={containerStyle}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: size / 3,
          height: size / 3,
          borderRadius: '50%',
          border: '3px solid white',
          background: currentConfig.color,
          color: 'white',
          fontSize: size / 8,
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
          zIndex: 20,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={currentConfig.label}
      >
        {currentConfig.icon}
      </button>

      {/* Expanded emotion wheel */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            padding: '10px',
            zIndex: 10,
          }}
        >
          {/* Emotion buttons in a circle */}
          {emotionList.map((emotion, index) => {
            const angle = (index / emotionList.length) * 2 * Math.PI - Math.PI / 2;
            const radius = size / 2 - 35;
            const x = Math.cos(angle) * radius + size / 2 - 20;
            const y = Math.sin(angle) * radius + size / 2 - 20;

            const config = EMOTIONS[emotion];
            const isActive = emotion === currentEmotion;

            return (
              <button
                key={emotion}
                onClick={() => handleEmotionClick(emotion)}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: isActive ? '3px solid #000' : '2px solid #ccc',
                  background: config.color,
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isActive
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
                  e.currentTarget.style.boxShadow = isActive
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 2px 4px rgba(0, 0, 0, 0.2)';
                }}
                title={config.label}
              >
                {config.icon}
              </button>
            );
          })}

          {/* Intensity slider */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              textAlign: 'center',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#666',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Intensity: {(localIntensity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localIntensity}
              onChange={handleIntensityChange}
              style={{
                width: '100%',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

EmotionWheel.displayName = 'EmotionWheel';
