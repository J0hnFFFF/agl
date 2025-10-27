import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Mesh, Group } from 'three';
import type { AvatarConfig } from '../types';

/**
 * Props for AvatarModel
 */
export interface AvatarModelProps {
  /** Avatar configuration */
  config: AvatarConfig;
  /** Debug mode */
  debug?: boolean;
  /** On model load callback */
  onLoad?: (model: any) => void;
  /** On model error callback */
  onError?: (error: Error) => void;
}

/**
 * Simple placeholder avatar
 * Used when no custom model is provided
 */
const PlaceholderAvatar: React.FC<{
  primaryColor: string;
  secondaryColor: string;
  scale: number;
  debug: boolean;
}> = ({ primaryColor, secondaryColor, scale, debug }) => {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const bodyRef = useRef<Mesh>(null);

  // Subtle idle animation
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Breathing animation
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(time * 2) * 0.02;
    }

    // Head movement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      headRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 16, 32]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.6} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.4, 1.2, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.6} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.7, 8, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>

      {/* Debug bounding box */}
      {debug && (
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1, 2.4, 1]} />
          <meshBasicMaterial color="#00ff00" wireframe />
        </mesh>
      )}
    </group>
  );
};

/**
 * GLTF model loader
 */
const GLTFAvatar: React.FC<{
  url: string;
  scale: number;
  onLoad?: (model: any) => void;
  onError?: (error: Error) => void;
}> = ({ url, scale, onLoad, onError }) => {
  const { scene, animations } = useGLTF(url, true);
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (scene) {
      onLoad?.({ scene, animations });
    }
  }, [scene, animations, onLoad]);

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};

/**
 * Custom model wrapper
 */
const CustomAvatar: React.FC<{
  model: any;
  scale: number;
  onLoad?: (model: any) => void;
}> = ({ model, scale, onLoad }) => {
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (model) {
      onLoad?.(model);
    }
  }, [model, onLoad]);

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={model} />
    </group>
  );
};

/**
 * AvatarModel - 3D model representation
 *
 * Supports:
 * - Placeholder geometry (default)
 * - GLTF/GLB models
 * - Custom pre-loaded models
 *
 * @example
 * ```tsx
 * // Placeholder
 * <AvatarModel config={{
 *   customization: {
 *     modelSource: { type: 'placeholder' },
 *     primaryColor: '#4169e1',
 *     secondaryColor: '#f5d7b1'
 *   }
 * }} />
 *
 * // GLTF model
 * <AvatarModel config={{
 *   customization: {
 *     modelSource: {
 *       type: 'gltf',
 *       url: '/models/character.gltf'
 *     }
 *   }
 * }} />
 * ```
 */
export const AvatarModel: React.FC<AvatarModelProps> = ({
  config,
  debug = false,
  onLoad,
  onError,
}) => {
  const { customization, scale = 1, position, rotation } = config;
  const { modelSource, primaryColor, secondaryColor, accentColor } = customization;

  // Model position and rotation
  const modelPosition: [number, number, number] = position
    ? [position.x, position.y, position.z]
    : [0, 0, 0];

  const modelRotation: [number, number, number] = rotation
    ? [(rotation.x * Math.PI) / 180, (rotation.y * Math.PI) / 180, (rotation.z * Math.PI) / 180]
    : [0, 0, 0];

  // Default colors
  const finalPrimaryColor = primaryColor || '#4169e1';
  const finalSecondaryColor = secondaryColor || '#f5d7b1';
  const modelScale = modelSource.scale || scale;

  return (
    <group position={modelPosition} rotation={modelRotation}>
      {/* Placeholder model */}
      {modelSource.type === 'placeholder' && (
        <PlaceholderAvatar
          primaryColor={finalPrimaryColor}
          secondaryColor={finalSecondaryColor}
          scale={modelScale}
          debug={debug}
        />
      )}

      {/* GLTF model */}
      {(modelSource.type === 'gltf' || modelSource.type === 'glb') && modelSource.url && (
        <GLTFAvatar
          url={modelSource.url}
          scale={modelScale}
          onLoad={onLoad}
          onError={onError}
        />
      )}

      {/* Custom model */}
      {modelSource.type === 'custom' && modelSource.model && (
        <CustomAvatar model={modelSource.model} scale={modelScale} onLoad={onLoad} />
      )}
    </group>
  );
};

AvatarModel.displayName = 'AvatarModel';

// Preload GLTF helper
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
