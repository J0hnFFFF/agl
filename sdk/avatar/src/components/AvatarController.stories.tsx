import type { Meta, StoryObj } from '@storybook/react';
import { AvatarController } from './AvatarController';

const meta: Meta<typeof AvatarController> = {
  title: 'Avatar/AvatarController',
  component: AvatarController,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    config: {
      description: 'Avatar configuration including customization and settings',
    },
    showEmotionWheel: {
      control: 'boolean',
      description: 'Show the emotion wheel UI',
    },
    emotionWheelPosition: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: 'Position of the emotion wheel',
    },
    dialogueText: {
      control: 'text',
      description: 'Current dialogue text to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarController>;

/**
 * Default placeholder avatar
 */
export const Default: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#4169e1',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'happy',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-right',
    width: 400,
    height: 600,
  },
};

/**
 * Custom colored avatar
 */
export const CustomColors: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#dc143c',
        secondaryColor: '#ffd700',
        accentColor: '#4682b4',
      },
      initialEmotion: 'confident',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'top-right',
    width: 400,
    height: 600,
  },
};

/**
 * Avatar with dialogue bubble
 */
export const WithDialogue: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#2e8b57',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'happy',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-right',
    bubbleConfig: {
      enabled: true,
      position: 'top',
      maxWidth: 300,
      autoHideDelay: 5000,
    },
    dialogueText: 'Hello! How can I help you today?',
    width: 400,
    height: 600,
  },
};

/**
 * Excited avatar
 */
export const Excited: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#ff69b4',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'excited',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-left',
    dialogueText: 'This is amazing! Did you see that?!',
    bubbleConfig: {
      enabled: true,
      position: 'top',
      maxWidth: 250,
    },
    width: 400,
    height: 600,
  },
};

/**
 * Sad avatar
 */
export const Sad: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#708090',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'sad',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: false,
    bubbleConfig: {
      enabled: true,
      position: 'top',
      maxWidth: 300,
    },
    dialogueText: "It's okay... We'll do better next time.",
    width: 400,
    height: 600,
  },
};

/**
 * Custom styled avatar
 */
export const CustomStyled: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#ffd700',
        secondaryColor: '#cd853f',
      },
      initialEmotion: 'proud',
      enableAnimations: true,
      enableInteractions: true,
      scale: 1.2,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-right',
    width: 500,
    height: 700,
    style: {
      border: '2px solid gold',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    },
  },
};

/**
 * Minimal - no interactions
 */
export const Minimal: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#4169e1',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'neutral',
      enableAnimations: false,
      enableInteractions: false,
    },
    showEmotionWheel: false,
    width: 300,
    height: 400,
  },
};

/**
 * GLTF model example (requires model file)
 * This demonstrates how to use custom GLTF models
 */
export const GLTFModel: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'gltf',
          url: '/models/character.gltf', // Game developers provide their own models
          scale: 1.0,
        },
      },
      initialEmotion: 'happy',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-right',
    width: 400,
    height: 600,
    handlers: {
      onModelLoad: (model) => {
        console.log('Model loaded:', model);
      },
      onModelError: (error) => {
        console.error('Model load error:', error);
      },
    },
  },
};

/**
 * Interactive demo with all features
 */
export const FullFeatured: Story = {
  args: {
    config: {
      customization: {
        modelSource: {
          type: 'placeholder',
        },
        primaryColor: '#4169e1',
        secondaryColor: '#f5d7b1',
      },
      initialEmotion: 'confident',
      enableAnimations: true,
      enableInteractions: true,
    },
    showEmotionWheel: true,
    emotionWheelPosition: 'bottom-right',
    bubbleConfig: {
      enabled: true,
      position: 'top',
      maxWidth: 350,
    },
    dialogueText: 'Try clicking the emotion wheel to change my mood!',
    width: 500,
    height: 700,
    handlers: {
      onEmotionChange: (emotion, intensity) => {
        console.log('Emotion changed:', emotion, 'Intensity:', intensity);
      },
      onClick: () => {
        console.log('Avatar clicked!');
      },
      onHover: (isHovering) => {
        console.log('Hovering:', isHovering);
      },
    },
  },
};
