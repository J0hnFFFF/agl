# Avatar SDK Guide

**3D Avatar Rendering Engine for AGL Platform**

The Avatar SDK provides a complete 3D avatar rendering solution with emotion-based animations, GLTF model support, and interactive UI components.

---

## Overview

The Avatar SDK is a **game-agnostic rendering engine** that handles all visual aspects of your AI companion character. It integrates seamlessly with AGL's emotion and dialogue services to create immersive, emotionally responsive companions.

### Key Features

- **3D Rendering Engine**: Three.js + React Three Fiber
- **Model Flexibility**: Placeholder models, GLTF/GLB support, custom models
- **Emotion System**: 12 emotions × 3 intensity levels = 36 animation states
- **Skeleton Animation**: Automatic emotion-based animation playback
- **Interactive UI**: Emotion wheel selector, dialogue bubbles
- **TypeScript**: Full type safety and IntelliSense support
- **Performance**: 60 FPS at 1080p, optimized memory usage
- **Extensible**: Plugin your own models, animations, and effects

---

## Installation

```bash
npm install @agl/avatar
```

### Peer Dependencies

```bash
npm install react react-dom three @react-three/fiber
```

---

## Quick Start

### 1. Basic Setup with Placeholder Avatar

Perfect for prototyping and testing:

```tsx
import { AvatarController } from '@agl/avatar';

function GameCompanion() {
  return (
    <AvatarController
      config={{
        customization: {
          modelSource: { type: 'placeholder' },
          primaryColor: '#4169e1',
          secondaryColor: '#f5d7b1'
        },
        initialEmotion: 'happy',
        enableAnimations: true
      }}
      showEmotionWheel={true}
      width={400}
      height={600}
    />
  );
}
```

### 2. Production Setup with GLTF Model

Load your custom 3D character:

```tsx
<AvatarController
  config={{
    customization: {
      modelSource: {
        type: 'gltf',
        url: '/models/my-character.gltf',
        scale: 1.0
      }
    },
    initialEmotion: 'confident',
    enableAnimations: true,
    enableInteractions: true
  }}
  handlers={{
    onModelLoad: (model) => console.log('Model loaded!', model),
    onModelError: (error) => console.error('Load error:', error),
    onEmotionChange: (emotion, intensity) => {
      console.log('Emotion changed:', emotion, intensity);
    }
  }}
/>
```

### 3. Full Integration with AGL Services

Connect avatar with emotion and dialogue services:

```tsx
import { AvatarController } from '@agl/avatar';
import { useAGLClient } from '@agl/web-sdk';

function AICompanion() {
  const { emotionState, currentDialogue } = useAGLClient();

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: '/models/companion.gltf'
          }
        },
        initialEmotion: emotionState.primary,
        enableAnimations: true
      }}
      dialogueText={currentDialogue}
      bubbleConfig={{
        enabled: true,
        position: 'top',
        maxWidth: 350,
        autoHideDelay: 5000
      }}
      showEmotionWheel={true}
    />
  );
}
```

---

## Core Concepts

### Emotion System

The Avatar SDK supports **12 emotion types** with **3 intensity variants** each:

**Emotion Types**:
- `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`
- `neutral`, `excited`, `proud`, `confident`, `disappointed`, `frustrated`

**Intensity Variants**:
- **subtle** (0-33%): Gentle, understated expressions
- **normal** (34-66%): Standard, balanced expressions
- **intense** (67-100%): Strong, dramatic expressions

**Automatic Mapping**:
```tsx
// Engine automatically selects appropriate animation
setEmotion('happy', 0.8);  // → Plays "celebrate" animation (intense)
setEmotion('happy', 0.4);  // → Plays "laugh" animation (normal)
setEmotion('happy', 0.2);  // → Plays "smile" animation (subtle)
```

### Model Sources

#### Placeholder Models (Prototyping)

Simple geometric shapes for rapid prototyping:

```tsx
modelSource: {
  type: 'placeholder',
  scale: 1.0
}
```

**Features**:
- Instant loading (< 200ms)
- No external assets required
- Basic transform animations
- Customizable colors

#### GLTF/GLB Models (Production)

Load your game's custom 3D models:

```tsx
modelSource: {
  type: 'gltf',
  url: '/assets/models/warrior.gltf',
  scale: 1.5
}
```

**Features**:
- Full skeleton animation support
- Material and texture support
- Automatic animation playback
- Draco compression support

#### Custom Models (Advanced)

Use pre-loaded Three.js objects:

```tsx
const model = await loader.loadAsync('/model.glb');

modelSource: {
  type: 'custom',
  model: model.scene
}
```

---

## Animation System

### For GLTF Models

The Avatar SDK automatically plays skeleton animations based on emotion and intensity.

**Animation Naming Convention**:

Your GLTF animations should follow this naming:

```
idle.glb                  // Default idle animation
happy.glb                // Happy (normal intensity)
happy_subtle.glb         // Happy (subtle)
happy_normal.glb         // Happy (normal)
happy_intense.glb        // Happy (intense)
sad.glb
angry.glb
excited.glb
// ... etc for all 12 emotions
```

**Example**:
```tsx
<AnimationPlayer
  model={gltfModel.scene}
  animations={gltfModel.animations}
  emotion="happy"
  intensity={0.8}
  isSpeaking={false}
  onAnimationStart={(name) => console.log('Started:', name)}
  onAnimationEnd={(name) => console.log('Ended:', name)}
/>
```

### For Placeholder Models

Simple transform-based animations (breathing, head movement).

---

## Components Reference

### AvatarController

Complete avatar system with rendering, UI, and interactions.

**Props**:

```typescript
interface AvatarControllerProps {
  config: AvatarConfig;              // Avatar configuration
  rendererOptions?: RendererOptions; // Three.js renderer settings
  showEmotionWheel?: boolean;        // Show emotion selector UI
  emotionWheelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  bubbleConfig?: BubbleConfig;       // Speech bubble configuration
  dialogueText?: string;             // Current dialogue text
  handlers?: AvatarEventHandlers;    // Event callbacks
  width?: number | string;           // Container width
  height?: number | string;          // Container height
}
```

### EmotionWheel

Interactive emotion selector UI component.

```tsx
<EmotionWheel
  currentEmotion="happy"
  currentIntensity={0.7}
  onEmotionChange={(emotion, intensity) => {
    console.log('Selected:', emotion, intensity);
  }}
/>
```

### BubbleTooltip

Speech bubble for displaying dialogue.

```tsx
<BubbleTooltip
  text="Hello, how are you doing today?"
  position="top"
  maxWidth={300}
  autoHideDelay={5000}
/>
```

---

## Event Handlers

```typescript
const handlers: AvatarEventHandlers = {
  // Emotion changes
  onEmotionChange: (emotion, intensity) => {
    console.log('Emotion:', emotion, 'Intensity:', intensity);
  },

  // Animation lifecycle
  onAnimationStart: (name) => {
    console.log('Animation started:', name);
  },
  onAnimationEnd: (name) => {
    console.log('Animation ended:', name);
  },

  // User interactions
  onClick: () => {
    console.log('Avatar clicked');
  },
  onHover: (isHovering) => {
    console.log('Hovering:', isHovering);
  },

  // Speaking state
  onSpeakingChange: (isSpeaking) => {
    console.log('Speaking:', isSpeaking);
  },

  // Model loading
  onModelLoad: (model) => {
    console.log('Model loaded:', model);
  },
  onModelError: (error) => {
    console.error('Model error:', error);
  }
};
```

---

## Integration Patterns

### With AGL Emotion Service

```tsx
import { useAGLClient } from '@agl/web-sdk';
import { AvatarController } from '@agl/avatar';

function EmotionSyncedAvatar() {
  const { emotionState } = useAGLClient();

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: { type: 'gltf', url: '/models/companion.gltf' }
        },
        initialEmotion: emotionState.primary
      }}
      handlers={{
        onEmotionChange: (emotion, intensity) => {
          // User manually changed emotion
          sendEvent('companion.emotion_override', { emotion, intensity });
        }
      }}
    />
  );
}
```

### With AGL Dialogue Service

```tsx
import { useDialogue } from '@agl/web-sdk';
import { AvatarController } from '@agl/avatar';

function DialogueAvatar() {
  const { currentDialogue, emotion } = useDialogue();

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: { type: 'gltf', url: '/models/companion.gltf' }
        },
        initialEmotion: emotion
      }}
      dialogueText={currentDialogue}
      bubbleConfig={{
        enabled: true,
        position: 'top',
        maxWidth: 350
      }}
    />
  );
}
```

---

## Model Requirements

### Creating GLTF Models for Avatar SDK

**1. Animation Naming**:
- Use the naming convention: `{emotion}_{intensity}.glb`
- Include an `idle.glb` animation
- Cover all 12 emotions (at minimum normal intensity)

**2. Model Scale**:
- Target height: ~2 units
- Use the `scale` parameter to adjust if needed

**3. Bone Structure**:
- Standard humanoid skeleton recommended
- Root bone at origin (0, 0, 0)

**4. File Size**:
- Recommended: < 5MB per model
- Use Draco compression for smaller files
- Optimize textures (max 1024x1024 for mobile)

**5. Testing**:
```bash
cd sdk/avatar
npm run storybook
# Test your model in the interactive viewer
```

---

## Performance Optimization

### Renderer Settings

```tsx
<AvatarController
  config={config}
  rendererOptions={{
    shadows: false,          // Disable for +20% FPS
    antialias: false,        // Disable on mobile
    pixelRatio: 1.0,        // Force 1.0 on mobile
    toneMapping: false       // Disable if not needed
  }}
/>
```

### Model Optimization

```tsx
// Preload models for faster initial render
import { preloadModel } from '@agl/avatar';

preloadModel('/models/character.gltf').then(() => {
  console.log('Model preloaded');
});
```

### Benchmarks

- **Rendering**: 60 FPS at 1080p
- **Memory**: ~10MB (placeholder), ~15-30MB (GLTF)
- **Load Time**: < 200ms (placeholder), varies by model size

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**: WebGL 2.0

---

## TypeScript Usage

```typescript
import type {
  AvatarConfig,
  ModelSource,
  EmotionType,
  AvatarEventHandlers,
  BubbleConfig
} from '@agl/avatar';

const config: AvatarConfig = {
  customization: {
    modelSource: {
      type: 'gltf',
      url: '/models/character.gltf'
    } as ModelSource,
    primaryColor: '#4169e1'
  },
  initialEmotion: 'happy' as EmotionType,
  enableAnimations: true
};
```

---

## Examples

See the [examples directory](../../sdk/avatar/examples/) for complete working examples:

- **basic-placeholder.tsx** - Simple setup with placeholder model
- **gltf-model.tsx** - Custom GLTF model integration
- **full-integration.tsx** - Complete AGL platform integration
- **multiple-avatars.tsx** - Multiple avatars in one scene

---

## API Reference

See the [SDK README](../../sdk/avatar/README.md) for complete API documentation.

---

## Support

- Issues: https://github.com/agl/avatar/issues
- Documentation: https://docs.agl.dev/sdk/avatar
- Examples: https://agl.dev/examples/avatar

---

**Build immersive, emotionally responsive companions with the Avatar SDK.**
