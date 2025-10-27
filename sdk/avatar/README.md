# @agl/avatar

**Engine-level 3D Virtual Avatar System for AGL**

Game-agnostic avatar rendering engine with emotion animations, GLTF support, and interactive UI components.

## Philosophy

This is an **engine**, not a game asset library:
- ✅ Provides rendering architecture and APIs
- ✅ Supports placeholder models for rapid prototyping
- ✅ Loads game-specific GLTF/GLB models
- ❌ Does NOT include game-specific 3D models
- ❌ Does NOT dictate art style or character design

**Game developers bring their own models. The engine handles everything else.**

---

## Features

- **3D Rendering Engine**: Three.js + React Three Fiber
- **Model Support**: Placeholder geometry, GLTF/GLB models, custom models
- **Emotion System**: 12 emotions × 3 intensity levels = 36 animation states
- **Skeleton Animation**: Automatic emotion-based animation playback
- **Interactive UI**: Emotion wheel, dialogue bubbles
- **TypeScript**: Full type safety
- **Performance**: 60 FPS, low memory footprint
- **Extensible**: Plugin your own models, animations, effects

---

## Installation

```bash
npm install @agl/avatar
```

### Peer Dependencies

```bash
npm install react react-dom
```

---

## Quick Start

### 1. Placeholder Avatar (Prototyping)

```tsx
import { AvatarController } from '@agl/avatar';

<AvatarController
  config={{
    customization: {
      modelSource: { type: 'placeholder' },
      primaryColor: '#4169e1',
      secondaryColor: '#f5d7b1'
    },
    initialEmotion: 'happy'
  }}
  showEmotionWheel={true}
  width={400}
  height={600}
/>
```

### 2. Your Own GLTF Model (Production)

```tsx
<AvatarController
  config={{
    customization: {
      modelSource: {
        type: 'gltf',
        url: '/models/my-character.gltf'
      }
    },
    initialEmotion: 'happy'
  }}
  handlers={{
    onModelLoad: (model) => console.log('Loaded!', model),
    onModelError: (error) => console.error('Error:', error)
  }}
/>
```

### 3. With Dialogue and Emotions

```tsx
<AvatarController
  config={{
    customization: {
      modelSource: { type: 'gltf', url: '/models/character.gltf' }
    },
    initialEmotion: 'confident',
    enableAnimations: true,
    enableInteractions: true
  }}
  showEmotionWheel={true}
  bubbleConfig={{
    enabled: true,
    position: 'top',
    maxWidth: 300
  }}
  dialogueText="Ready for battle!"
  handlers={{
    onEmotionChange: (emotion, intensity) => {
      // Sync with your game state
      gameState.companionEmotion = emotion;
    }
  }}
/>
```

---

## Core Concepts

### Model Sources

The engine supports three model types:

#### Placeholder (Default)
Simple geometric shapes for prototyping.

```tsx
modelSource: {
  type: 'placeholder',
  scale: 1.0
}
```

#### GLTF/GLB (Production)
Load your game's 3D models.

```tsx
modelSource: {
  type: 'gltf',
  url: '/assets/models/warrior.gltf',
  scale: 1.5
}
```

#### Custom (Pre-loaded)
Use pre-loaded Three.js objects.

```tsx
const model = await loader.loadAsync('/model.glb');

modelSource: {
  type: 'custom',
  model: model.scene
}
```

---

### Emotion System

**12 Emotion Types**:
- `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`
- `neutral`, `excited`, `proud`, `confident`, `disappointed`, `frustrated`

**3 Intensity Variants**:
- `subtle` (0-33%): Gentle expressions
- `normal` (34-66%): Standard expressions
- `intense` (67-100%): Strong expressions

**Automatic Mapping**:
```tsx
// Engine automatically selects animation based on emotion + intensity
setEmotion('happy', 0.8);  // Plays "celebrate" animation (intense variant)
setEmotion('happy', 0.4);  // Plays "laugh" animation (normal variant)
setEmotion('happy', 0.2);  // Plays "smile" animation (subtle variant)
```

---

### Animation System

#### For Placeholder Models
Simple transform animations (breathing, head movement).

#### For GLTF Models
Automatic skeleton animation playback using `AnimationMixer`.

**Animation Naming Convention**:
Your GLTF animations should be named like:
- `happy`, `happy_subtle`, `happy_normal`, `happy_intense`
- `sad`, `angry`, `excited`, etc.
- `idle` (fallback animation)

**Example**:
```tsx
import { AnimationPlayer } from '@agl/avatar';

<AnimationPlayer
  model={gltfModel.scene}
  animations={gltfModel.animations}
  emotion="happy"
  intensity={0.8}
  isSpeaking={false}
  onAnimationStart={(name) => console.log('Started:', name)}
/>
```

---

## Components

### AvatarController

Complete avatar system with rendering, UI, and interactions.

**Props**:
```typescript
{
  config: AvatarConfig;              // Avatar configuration
  rendererOptions?: RendererOptions; // Three.js renderer settings
  showEmotionWheel?: boolean;        // Show emotion selector
  emotionWheelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  bubbleConfig?: BubbleConfig;       // Speech bubble settings
  dialogueText?: string;             // Current dialogue
  handlers?: AvatarEventHandlers;    // Event callbacks
  width?: number | string;
  height?: number | string;
}
```

### AvatarRenderer

Low-level 3D renderer (use `AvatarController` instead unless you need full control).

### EmotionWheel

Interactive emotion selector UI.

```tsx
<EmotionWheel
  currentEmotion="happy"
  currentIntensity={0.7}
  onEmotionChange={(emotion, intensity) => {
    console.log(emotion, intensity);
  }}
/>
```

### BubbleTooltip

Speech bubble for dialogue.

```tsx
<BubbleTooltip
  text="Hello world!"
  position="top"
  maxWidth={300}
  autoHideDelay={5000}
/>
```

### AnimationPlayer

Skeleton animation controller (automatic in `AvatarController`).

---

## TypeScript Usage

```typescript
import type {
  AvatarConfig,
  ModelSource,
  EmotionType,
  AvatarEventHandlers
} from '@agl/avatar';

const config: AvatarConfig = {
  customization: {
    modelSource: {
      type: 'gltf',
      url: '/models/character.gltf'
    } as ModelSource,
    primaryColor: '#4169e1'
  },
  initialEmotion: 'happy' as EmotionType
};

const handlers: AvatarEventHandlers = {
  onEmotionChange: (emotion, intensity) => {
    // Type-safe handlers
  }
};
```

---

## Game Integration Examples

### With AGL Emotion Service

```tsx
import { useAGLClient } from '@agl/web-sdk';
import { AvatarController } from '@agl/avatar';

function GameCompanion() {
  const { emotionState, sendEvent } = useAGLClient();

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: '/models/companion.gltf'
          }
        },
        // Sync with emotion service
        initialEmotion: emotionState.primary
      }}
      handlers={{
        onEmotionChange: (emotion, intensity) => {
          // User manually changed emotion via wheel
          sendEvent('companion.emotion_changed', { emotion, intensity });
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

function GameCompanion() {
  const { currentDialogue, emotion } = useDialogue();

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: '/models/companion.gltf'
          }
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

## Event Handlers

```tsx
const handlers: AvatarEventHandlers = {
  // Emotion changes
  onEmotionChange: (emotion, intensity) => {},

  // Animation lifecycle
  onAnimationStart: (name) => {},
  onAnimationEnd: (name) => {},

  // Interactions
  onClick: () => {},
  onHover: (isHovering) => {},
  onInteraction: (event) => {},

  // Speaking state
  onSpeakingChange: (isSpeaking) => {},

  // Model loading
  onModelLoad: (model) => {},
  onModelError: (error) => {}
};
```

---

## Performance

### Benchmarks
- **Rendering**: 60 FPS at 1080p
- **Memory**: ~10MB per instance (placeholder), ~15-30MB (GLTF)
- **Load time**: < 200ms (placeholder), varies by GLTF size

### Optimization

```tsx
<AvatarController
  config={config}
  rendererOptions={{
    shadows: false,          // Disable shadows for performance
    antialias: false,        // Disable AA on mobile
    pixelRatio: 1.0,        // Fixed pixel ratio
  }}
/>
```

---

## Model Requirements

### For Game Developers

When creating GLTF models for this engine:

**1. Animation Naming**:
```
- idle.glb
- happy.glb (or happy_normal.glb)
- happy_subtle.glb
- happy_intense.glb
- sad.glb
- angry.glb
... (for all 12 emotions)
```

**2. Model Scale**:
- Engine expects models at ~2 units tall
- Adjust with `scale` parameter if needed

**3. Bone Structure**:
- Standard humanoid skeleton
- Root bone at origin

**4. File Size**:
- Recommended < 5MB per model
- Use Draco compression

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requires**: WebGL 2.0

---

## Examples

### Complete Integration

```tsx
import { AvatarController, preloadModel } from '@agl/avatar';
import { useEffect, useState } from 'react';

// Preload model
preloadModel('/models/character.gltf');

function MyGame() {
  const [emotion, setEmotion] = useState('neutral');
  const [dialogue, setDialogue] = useState('');

  // Game events
  useEffect(() => {
    gameEvents.on('victory', () => {
      setEmotion('excited');
      setDialogue('We won! Great job!');
    });

    gameEvents.on('defeat', () => {
      setEmotion('disappointed');
      setDialogue("It's okay, we'll try again!");
    });
  }, []);

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: '/models/character.gltf'
          }
        },
        initialEmotion: emotion,
        enableAnimations: true,
        enableInteractions: true
      }}
      showEmotionWheel={true}
      bubbleConfig={{
        enabled: true,
        position: 'top',
        maxWidth: 300,
        autoHideDelay: 5000
      }}
      dialogueText={dialogue}
      handlers={{
        onEmotionChange: (newEmotion, intensity) => {
          setEmotion(newEmotion);
          analytics.track('companion_emotion_manual', { newEmotion, intensity });
        }
      }}
    />
  );
}
```

---

## Development

### Storybook

```bash
cd sdk/avatar
npm run storybook
```

Visit `http://localhost:6006`

### Testing

```bash
npm test
npm run test:coverage
```

---

## API Reference

See TypeScript definitions for complete API:
- `src/types/index.ts` - All type definitions
- `src/components/` - Component APIs
- `src/animations/emotionMap.ts` - Animation mappings

---

## FAQ

### Q: Can I use 2D sprites instead of 3D models?
A: Currently 3D only. 2D sprite support planned for future release.

### Q: Where do I get 3D models?
A: Create your own, or use free resources like:
- Mixamo (rigged characters)
- Sketchfab (free models)
- Ready Player Me (customizable avatars)

### Q: Can I customize animations?
A: Yes! Provide your own GLTF with custom animations. The engine will play them based on emotion/intensity mapping.

### Q: Performance on mobile?
A: Disable shadows and antialiasing. Use lower-poly models. Aim for < 10k triangles.

### Q: Multiple avatars in one scene?
A: Yes, but limit to 3-5 for performance.

---

## License

Proprietary - Copyright © 2024 AGL Team

---

## Support

- GitHub: https://github.com/agl/avatar
- Discord: https://discord.gg/agl
- Docs: https://docs.agl.dev/avatar

---

**This is an engine. Bring your own models. Build amazing companions.**
