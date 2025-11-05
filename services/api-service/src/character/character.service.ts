import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Character Service
 *
 * Provides character/persona data including 3D model URLs for Avatar SDK integration.
 *
 * Characters are static data (no database), configured via environment variables.
 * Each character includes:
 * - Basic info (name, persona, description)
 * - 3D model URLs (GLTF model + animations)
 * - Visual assets (thumbnail, preview images)
 */
@Injectable()
export class CharacterService {
  private readonly cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    // Get CDN base URL from environment
    // Default to placeholder URLs for development
    this.cdnBaseUrl = this.configService.get<string>(
      'CDN_BASE_URL',
      'https://cdn.example.com/agl/models'
    );
  }

  /**
   * Get all available characters with their 3D model configurations
   *
   * Returns character data including:
   * - Character metadata (id, name, persona, description)
   * - 3D model URLs for Avatar SDK
   * - Animation URLs (36 animations per character: 12 emotions × 3 intensities)
   * - Thumbnail and preview images
   *
   * @returns Array of character objects with model URLs
   */
  async findAll() {
    return {
      characters: [
        {
          // Cheerful Companion - Female, energetic, positive
          id: '1',
          name: 'Cheerful Companion',
          persona: 'cheerful',
          description: 'An energetic and positive companion who celebrates your victories',
          gender: 'female',

          // 3D Model Configuration for Avatar SDK
          modelConfig: {
            // Main model file (GLTF format)
            modelUrl: `${this.cdnBaseUrl}/cheerful/model.gltf`,

            // Visual assets
            thumbnailUrl: `${this.cdnBaseUrl}/cheerful/thumbnail.png`,
            previewUrl: `${this.cdnBaseUrl}/cheerful/preview.png`,

            // Model properties
            scale: 1.0,
            position: { x: 0, y: 0, z: 0 },

            // Animation URLs (36 animations: 12 emotions × 3 intensities)
            animations: {
              // Idle animation
              idle: `${this.cdnBaseUrl}/cheerful/animations/idle.gltf`,

              // Happy variants
              happy_subtle: `${this.cdnBaseUrl}/cheerful/animations/happy_subtle.gltf`,
              happy_normal: `${this.cdnBaseUrl}/cheerful/animations/happy_normal.gltf`,
              happy_intense: `${this.cdnBaseUrl}/cheerful/animations/happy_intense.gltf`,

              // Sad variants
              sad_subtle: `${this.cdnBaseUrl}/cheerful/animations/sad_subtle.gltf`,
              sad_normal: `${this.cdnBaseUrl}/cheerful/animations/sad_normal.gltf`,
              sad_intense: `${this.cdnBaseUrl}/cheerful/animations/sad_intense.gltf`,

              // Angry variants
              angry_subtle: `${this.cdnBaseUrl}/cheerful/animations/angry_subtle.gltf`,
              angry_normal: `${this.cdnBaseUrl}/cheerful/animations/angry_normal.gltf`,
              angry_intense: `${this.cdnBaseUrl}/cheerful/animations/angry_intense.gltf`,

              // Excited variants
              excited_subtle: `${this.cdnBaseUrl}/cheerful/animations/excited_subtle.gltf`,
              excited_normal: `${this.cdnBaseUrl}/cheerful/animations/excited_normal.gltf`,
              excited_intense: `${this.cdnBaseUrl}/cheerful/animations/excited_intense.gltf`,

              // Proud variants
              proud_subtle: `${this.cdnBaseUrl}/cheerful/animations/proud_subtle.gltf`,
              proud_normal: `${this.cdnBaseUrl}/cheerful/animations/proud_normal.gltf`,
              proud_intense: `${this.cdnBaseUrl}/cheerful/animations/proud_intense.gltf`,

              // Confident variants
              confident_subtle: `${this.cdnBaseUrl}/cheerful/animations/confident_subtle.gltf`,
              confident_normal: `${this.cdnBaseUrl}/cheerful/animations/confident_normal.gltf`,
              confident_intense: `${this.cdnBaseUrl}/cheerful/animations/confident_intense.gltf`,

              // Disappointed variants
              disappointed_subtle: `${this.cdnBaseUrl}/cheerful/animations/disappointed_subtle.gltf`,
              disappointed_normal: `${this.cdnBaseUrl}/cheerful/animations/disappointed_normal.gltf`,
              disappointed_intense: `${this.cdnBaseUrl}/cheerful/animations/disappointed_intense.gltf`,

              // Frustrated variants
              frustrated_subtle: `${this.cdnBaseUrl}/cheerful/animations/frustrated_subtle.gltf`,
              frustrated_normal: `${this.cdnBaseUrl}/cheerful/animations/frustrated_normal.gltf`,
              frustrated_intense: `${this.cdnBaseUrl}/cheerful/animations/frustrated_intense.gltf`,

              // Surprised variants
              surprised_subtle: `${this.cdnBaseUrl}/cheerful/animations/surprised_subtle.gltf`,
              surprised_normal: `${this.cdnBaseUrl}/cheerful/animations/surprised_normal.gltf`,
              surprised_intense: `${this.cdnBaseUrl}/cheerful/animations/surprised_intense.gltf`,

              // Fearful variants
              fearful_subtle: `${this.cdnBaseUrl}/cheerful/animations/fearful_subtle.gltf`,
              fearful_normal: `${this.cdnBaseUrl}/cheerful/animations/fearful_normal.gltf`,
              fearful_intense: `${this.cdnBaseUrl}/cheerful/animations/fearful_intense.gltf`,

              // Disgusted variants
              disgusted_subtle: `${this.cdnBaseUrl}/cheerful/animations/disgusted_subtle.gltf`,
              disgusted_normal: `${this.cdnBaseUrl}/cheerful/animations/disgusted_normal.gltf`,
              disgusted_intense: `${this.cdnBaseUrl}/cheerful/animations/disgusted_intense.gltf`,

              // Neutral variants
              neutral_subtle: `${this.cdnBaseUrl}/cheerful/animations/neutral_subtle.gltf`,
              neutral_normal: `${this.cdnBaseUrl}/cheerful/animations/neutral_normal.gltf`,
              neutral_intense: `${this.cdnBaseUrl}/cheerful/animations/neutral_intense.gltf`,
            },

            // Recommended Avatar SDK settings
            avatarSettings: {
              shadows: true,
              antialias: true,
              autoRotate: false,
            }
          },

          // Voice configuration (for Voice Service integration)
          voiceConfig: {
            defaultVoice: 'nova',
            language: 'zh-CN',
            speed: 1.0
          }
        },

        {
          // Cool Mentor - Male, calm, authoritative
          id: '2',
          name: 'Cool Mentor',
          persona: 'cool',
          description: 'A calm and strategic mentor who provides tactical advice',
          gender: 'male',

          modelConfig: {
            modelUrl: `${this.cdnBaseUrl}/cool/model.gltf`,
            thumbnailUrl: `${this.cdnBaseUrl}/cool/thumbnail.png`,
            previewUrl: `${this.cdnBaseUrl}/cool/preview.png`,
            scale: 1.0,
            position: { x: 0, y: 0, z: 0 },

            animations: {
              idle: `${this.cdnBaseUrl}/cool/animations/idle.gltf`,

              happy_subtle: `${this.cdnBaseUrl}/cool/animations/happy_subtle.gltf`,
              happy_normal: `${this.cdnBaseUrl}/cool/animations/happy_normal.gltf`,
              happy_intense: `${this.cdnBaseUrl}/cool/animations/happy_intense.gltf`,

              sad_subtle: `${this.cdnBaseUrl}/cool/animations/sad_subtle.gltf`,
              sad_normal: `${this.cdnBaseUrl}/cool/animations/sad_normal.gltf`,
              sad_intense: `${this.cdnBaseUrl}/cool/animations/sad_intense.gltf`,

              angry_subtle: `${this.cdnBaseUrl}/cool/animations/angry_subtle.gltf`,
              angry_normal: `${this.cdnBaseUrl}/cool/animations/angry_normal.gltf`,
              angry_intense: `${this.cdnBaseUrl}/cool/animations/angry_intense.gltf`,

              excited_subtle: `${this.cdnBaseUrl}/cool/animations/excited_subtle.gltf`,
              excited_normal: `${this.cdnBaseUrl}/cool/animations/excited_normal.gltf`,
              excited_intense: `${this.cdnBaseUrl}/cool/animations/excited_intense.gltf`,

              proud_subtle: `${this.cdnBaseUrl}/cool/animations/proud_subtle.gltf`,
              proud_normal: `${this.cdnBaseUrl}/cool/animations/proud_normal.gltf`,
              proud_intense: `${this.cdnBaseUrl}/cool/animations/proud_intense.gltf`,

              confident_subtle: `${this.cdnBaseUrl}/cool/animations/confident_subtle.gltf`,
              confident_normal: `${this.cdnBaseUrl}/cool/animations/confident_normal.gltf`,
              confident_intense: `${this.cdnBaseUrl}/cool/animations/confident_intense.gltf`,

              disappointed_subtle: `${this.cdnBaseUrl}/cool/animations/disappointed_subtle.gltf`,
              disappointed_normal: `${this.cdnBaseUrl}/cool/animations/disappointed_normal.gltf`,
              disappointed_intense: `${this.cdnBaseUrl}/cool/animations/disappointed_intense.gltf`,

              frustrated_subtle: `${this.cdnBaseUrl}/cool/animations/frustrated_subtle.gltf`,
              frustrated_normal: `${this.cdnBaseUrl}/cool/animations/frustrated_normal.gltf`,
              frustrated_intense: `${this.cdnBaseUrl}/cool/animations/frustrated_intense.gltf`,

              surprised_subtle: `${this.cdnBaseUrl}/cool/animations/surprised_subtle.gltf`,
              surprised_normal: `${this.cdnBaseUrl}/cool/animations/surprised_normal.gltf`,
              surprised_intense: `${this.cdnBaseUrl}/cool/animations/surprised_intense.gltf`,

              fearful_subtle: `${this.cdnBaseUrl}/cool/animations/fearful_subtle.gltf`,
              fearful_normal: `${this.cdnBaseUrl}/cool/animations/fearful_normal.gltf`,
              fearful_intense: `${this.cdnBaseUrl}/cool/animations/fearful_intense.gltf`,

              disgusted_subtle: `${this.cdnBaseUrl}/cool/animations/disgusted_subtle.gltf`,
              disgusted_normal: `${this.cdnBaseUrl}/cool/animations/disgusted_normal.gltf`,
              disgusted_intense: `${this.cdnBaseUrl}/cool/animations/disgusted_intense.gltf`,

              neutral_subtle: `${this.cdnBaseUrl}/cool/animations/neutral_subtle.gltf`,
              neutral_normal: `${this.cdnBaseUrl}/cool/animations/neutral_normal.gltf`,
              neutral_intense: `${this.cdnBaseUrl}/cool/animations/neutral_intense.gltf`,
            },

            avatarSettings: {
              shadows: true,
              antialias: true,
              autoRotate: false,
            }
          },

          voiceConfig: {
            defaultVoice: 'onyx',
            language: 'zh-CN',
            speed: 1.0
          }
        },

        {
          // Cute Assistant - Female, friendly, supportive
          id: '3',
          name: 'Cute Assistant',
          persona: 'cute',
          description: 'A friendly and supportive assistant who encourages you',
          gender: 'female',

          modelConfig: {
            modelUrl: `${this.cdnBaseUrl}/cute/model.gltf`,
            thumbnailUrl: `${this.cdnBaseUrl}/cute/thumbnail.png`,
            previewUrl: `${this.cdnBaseUrl}/cute/preview.png`,
            scale: 1.0,
            position: { x: 0, y: 0, z: 0 },

            animations: {
              idle: `${this.cdnBaseUrl}/cute/animations/idle.gltf`,

              happy_subtle: `${this.cdnBaseUrl}/cute/animations/happy_subtle.gltf`,
              happy_normal: `${this.cdnBaseUrl}/cute/animations/happy_normal.gltf`,
              happy_intense: `${this.cdnBaseUrl}/cute/animations/happy_intense.gltf`,

              sad_subtle: `${this.cdnBaseUrl}/cute/animations/sad_subtle.gltf`,
              sad_normal: `${this.cdnBaseUrl}/cute/animations/sad_normal.gltf`,
              sad_intense: `${this.cdnBaseUrl}/cute/animations/sad_intense.gltf`,

              angry_subtle: `${this.cdnBaseUrl}/cute/animations/angry_subtle.gltf`,
              angry_normal: `${this.cdnBaseUrl}/cute/animations/angry_normal.gltf`,
              angry_intense: `${this.cdnBaseUrl}/cute/animations/angry_intense.gltf`,

              excited_subtle: `${this.cdnBaseUrl}/cute/animations/excited_subtle.gltf`,
              excited_normal: `${this.cdnBaseUrl}/cute/animations/excited_normal.gltf`,
              excited_intense: `${this.cdnBaseUrl}/cute/animations/excited_intense.gltf`,

              proud_subtle: `${this.cdnBaseUrl}/cute/animations/proud_subtle.gltf`,
              proud_normal: `${this.cdnBaseUrl}/cute/animations/proud_normal.gltf`,
              proud_intense: `${this.cdnBaseUrl}/cute/animations/proud_intense.gltf`,

              confident_subtle: `${this.cdnBaseUrl}/cute/animations/confident_subtle.gltf`,
              confident_normal: `${this.cdnBaseUrl}/cute/animations/confident_normal.gltf`,
              confident_intense: `${this.cdnBaseUrl}/cute/animations/confident_intense.gltf`,

              disappointed_subtle: `${this.cdnBaseUrl}/cute/animations/disappointed_subtle.gltf`,
              disappointed_normal: `${this.cdnBaseUrl}/cute/animations/disappointed_normal.gltf`,
              disappointed_intense: `${this.cdnBaseUrl}/cute/animations/disappointed_intense.gltf`,

              frustrated_subtle: `${this.cdnBaseUrl}/cute/animations/frustrated_subtle.gltf`,
              frustrated_normal: `${this.cdnBaseUrl}/cute/animations/frustrated_normal.gltf`,
              frustrated_intense: `${this.cdnBaseUrl}/cute/animations/frustrated_intense.gltf`,

              surprised_subtle: `${this.cdnBaseUrl}/cute/animations/surprised_subtle.gltf`,
              surprised_normal: `${this.cdnBaseUrl}/cute/animations/surprised_normal.gltf`,
              surprised_intense: `${this.cdnBaseUrl}/cute/animations/surprised_intense.gltf`,

              fearful_subtle: `${this.cdnBaseUrl}/cute/animations/fearful_subtle.gltf`,
              fearful_normal: `${this.cdnBaseUrl}/cute/animations/fearful_normal.gltf`,
              fearful_intense: `${this.cdnBaseUrl}/cute/animations/fearful_intense.gltf`,

              disgusted_subtle: `${this.cdnBaseUrl}/cute/animations/disgusted_subtle.gltf`,
              disgusted_normal: `${this.cdnBaseUrl}/cute/animations/disgusted_normal.gltf`,
              disgusted_intense: `${this.cdnBaseUrl}/cute/animations/disgusted_intense.gltf`,

              neutral_subtle: `${this.cdnBaseUrl}/cute/animations/neutral_subtle.gltf`,
              neutral_normal: `${this.cdnBaseUrl}/cute/animations/neutral_normal.gltf`,
              neutral_intense: `${this.cdnBaseUrl}/cute/animations/neutral_intense.gltf`,
            },

            avatarSettings: {
              shadows: true,
              antialias: true,
              autoRotate: false,
            }
          },

          voiceConfig: {
            defaultVoice: 'shimmer',
            language: 'zh-CN',
            speed: 1.0
          }
        },
      ],
    };
  }
}
