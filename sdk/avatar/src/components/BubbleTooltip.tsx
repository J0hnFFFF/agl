import React, { useEffect, useState } from 'react';

/**
 * Props for BubbleTooltip
 */
export interface BubbleTooltipProps {
  /** Tooltip text content */
  text: string;
  /** Position relative to avatar */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Max width in pixels */
  maxWidth?: number;
  /** Auto-hide delay in milliseconds */
  autoHideDelay?: number;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * BubbleTooltip - Speech bubble for avatar dialogue
 *
 * Displays dialogue text in a comic-style speech bubble above or around
 * the avatar. Supports auto-hide and custom styling.
 *
 * @example
 * ```tsx
 * <BubbleTooltip
 *   text="Hello! How can I help you today?"
 *   position="top"
 *   maxWidth={300}
 *   autoHideDelay={5000}
 * />
 * ```
 */
export const BubbleTooltip: React.FC<BubbleTooltipProps> = ({
  text,
  position = 'top',
  maxWidth = 300,
  autoHideDelay,
  className,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    if (autoHideDelay) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [text, autoHideDelay]);

  if (!isVisible || !text) {
    return null;
  }

  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 100,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '10px',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '10px',
        };
      case 'left':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '10px',
        };
      case 'right':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '10px',
        };
    }
  };

  const getTailStyle = (): React.CSSProperties => {
    const tailSize = 12;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      border: `${tailSize}px solid transparent`,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: -tailSize * 2,
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: 'white',
          borderBottom: 'none',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: -tailSize * 2,
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: 'white',
          borderTop: 'none',
        };
      case 'left':
        return {
          ...baseStyle,
          right: -tailSize * 2,
          top: '50%',
          transform: 'translateY(-50%)',
          borderLeftColor: 'white',
          borderRight: 'none',
        };
      case 'right':
        return {
          ...baseStyle,
          left: -tailSize * 2,
          top: '50%',
          transform: 'translateY(-50%)',
          borderRightColor: 'white',
          borderLeft: 'none',
        };
    }
  };

  const bubbleStyle: React.CSSProperties = {
    ...getPositionStyle(),
    maxWidth,
    background: 'white',
    color: '#333',
    padding: '12px 16px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '14px',
    lineHeight: '1.4',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    animation: 'bubble-appear 0.3s ease-out',
    ...style,
  };

  return (
    <>
      <style>
        {`
          @keyframes bubble-appear {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
      <div className={className} style={bubbleStyle}>
        {text}
        <div style={getTailStyle()} />
      </div>
    </>
  );
};

BubbleTooltip.displayName = 'BubbleTooltip';
