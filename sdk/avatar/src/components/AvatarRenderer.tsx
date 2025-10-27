import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import type { RendererOptions, AvatarConfig } from '../types';
import { AvatarModel } from './AvatarModel';

/**
 * Props for AvatarRenderer
 */
export interface AvatarRendererProps {
  /** Avatar configuration */
  config: AvatarConfig;
  /** Renderer options */
  options?: RendererOptions;
  /** Canvas width */
  width?: number | string;
  /** Canvas height */
  height?: number | string;
  /** Enable debug mode */
  debug?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
};

/**
 * AvatarRenderer - Main 3D avatar rendering component
 *
 * Renders a 3D avatar with Three.js using React Three Fiber.
 * Supports customization, animations, and interactions.
 *
 * @example
 * ```tsx
 * <AvatarRenderer
 *   config={{
 *     customization: {
 *       character: 'warrior',
 *       skin: 'medium',
 *       hairstyle: 'short',
 *       outfit: 'armor'
 *     },
 *     initialEmotion: 'happy',
 *     visibilityMode: 'always'
 *   }}
 *   options={{
 *     shadows: true,
 *     antialias: true
 *   }}
 *   width={400}
 *   height={600}
 * />
 * ```
 */
export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  config,
  options = {},
  width = '100%',
  height = '100%',
  debug = false,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    shadows = true,
    antialias = true,
    alpha = true,
    pixelRatio,
    backgroundColor = '#1a1a1a',
    autoRotate = false,
    camera = {},
  } = options;

  const {
    fov = 50,
    near = 0.1,
    far = 1000,
    position = { x: 0, y: 1.5, z: 5 },
  } = camera;

  useEffect(() => {
    // Initialize renderer
    setIsReady(true);

    return () => {
      // Cleanup
      setIsReady(false);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor,
    position: 'relative',
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <Canvas
        ref={canvasRef}
        shadows={shadows}
        dpr={pixelRatio || window.devicePixelRatio}
        gl={{
          antialias,
          alpha,
          preserveDrawingBuffer: true,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          fov={fov}
          near={near}
          far={far}
          position={[position.x, position.y, position.z]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow={shadows}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.5} />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Avatar Model */}
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel config={config} debug={debug} />
        </Suspense>

        {/* Ground (optional, for shadows) */}
        {shadows && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        )}

        {/* Controls */}
        {debug && (
          <OrbitControls
            enableZoom
            enablePan
            enableRotate
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
        )}

        {/* Debug helpers */}
        {debug && (
          <>
            <axesHelper args={[5]} />
            <gridHelper args={[10, 10]} />
          </>
        )}
      </Canvas>

      {/* Debug overlay */}
      {debug && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
          }}
        >
          <div>Character: {config.customization.character}</div>
          <div>Emotion: {config.initialEmotion || 'neutral'}</div>
          <div>Visibility: {config.visibilityMode || 'always'}</div>
          <div>Animations: {config.enableAnimations ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  );
};

AvatarRenderer.displayName = 'AvatarRenderer';
