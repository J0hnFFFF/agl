import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CharacterService } from './character.service';

describe('CharacterService', () => {
  let service: CharacterService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'CDN_BASE_URL') {
                return 'https://test-cdn.example.com/models';
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return 3 characters', async () => {
      const result = await service.findAll();

      expect(result.characters).toBeDefined();
      expect(result.characters).toHaveLength(3);
    });

    it('should return characters with correct personas', async () => {
      const result = await service.findAll();

      const personas = result.characters.map((c) => c.persona);
      expect(personas).toEqual(['cheerful', 'cool', 'cute']);
    });

    it('should return characters with all required fields', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        // Basic info
        expect(character.id).toBeDefined();
        expect(character.name).toBeDefined();
        expect(character.persona).toBeDefined();
        expect(character.description).toBeDefined();
        expect(character.gender).toBeDefined();

        // Model config
        expect(character.modelConfig).toBeDefined();
        expect(character.modelConfig.modelUrl).toBeDefined();
        expect(character.modelConfig.thumbnailUrl).toBeDefined();
        expect(character.modelConfig.previewUrl).toBeDefined();
        expect(character.modelConfig.scale).toBeDefined();
        expect(character.modelConfig.position).toBeDefined();
        expect(character.modelConfig.animations).toBeDefined();
        expect(character.modelConfig.avatarSettings).toBeDefined();

        // Voice config
        expect(character.voiceConfig).toBeDefined();
        expect(character.voiceConfig.defaultVoice).toBeDefined();
        expect(character.voiceConfig.language).toBeDefined();
        expect(character.voiceConfig.speed).toBeDefined();
      });
    });

    it('should include exactly 37 animations per character (1 idle + 36 emotion variants)', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        const animationKeys = Object.keys(character.modelConfig.animations);
        expect(animationKeys).toHaveLength(37);

        // Check for idle animation
        expect(animationKeys).toContain('idle');

        // Check for all emotion variants (12 emotions × 3 intensities)
        const emotions = [
          'happy',
          'sad',
          'angry',
          'excited',
          'proud',
          'confident',
          'disappointed',
          'frustrated',
          'surprised',
          'fearful',
          'disgusted',
          'neutral',
        ];

        const intensities = ['subtle', 'normal', 'intense'];

        emotions.forEach((emotion) => {
          intensities.forEach((intensity) => {
            const key = `${emotion}_${intensity}`;
            expect(animationKeys).toContain(key);
          });
        });
      });
    });

    it('should construct valid CDN URLs using config', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        const cdnBase = 'https://test-cdn.example.com/models';

        // Check model URL
        expect(character.modelConfig.modelUrl).toBe(
          `${cdnBase}/${character.persona}/model.gltf`,
        );

        // Check thumbnail URL
        expect(character.modelConfig.thumbnailUrl).toBe(
          `${cdnBase}/${character.persona}/thumbnail.png`,
        );

        // Check preview URL
        expect(character.modelConfig.previewUrl).toBe(
          `${cdnBase}/${character.persona}/preview.png`,
        );

        // Check animation URLs
        Object.entries(character.modelConfig.animations).forEach(
          ([animKey, animUrl]) => {
            expect(animUrl).toBe(
              `${cdnBase}/${character.persona}/animations/${animKey}.gltf`,
            );
          },
        );
      });
    });

    it('should use correct default CDN URL when not configured', async () => {
      // Create a new service instance with default CDN
      const moduleWithDefault = await Test.createTestingModule({
        providers: [
          CharacterService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: string) => {
                return defaultValue; // Return default value
              }),
            },
          },
        ],
      }).compile();

      const serviceWithDefault =
        moduleWithDefault.get<CharacterService>(CharacterService);
      const result = await serviceWithDefault.findAll();

      const defaultCdn = 'https://cdn.example.com/agl/models';
      expect(result.characters[0].modelConfig.modelUrl).toBe(
        `${defaultCdn}/cheerful/model.gltf`,
      );
    });

    it('should map personas to correct voice settings', async () => {
      const result = await service.findAll();

      const voiceMap = {
        cheerful: 'nova',
        cool: 'onyx',
        cute: 'shimmer',
      };

      result.characters.forEach((character) => {
        expect(character.voiceConfig.defaultVoice).toBe(
          voiceMap[character.persona as keyof typeof voiceMap],
        );
        expect(character.voiceConfig.language).toBe('zh-CN');
        expect(character.voiceConfig.speed).toBe(1.0);
      });
    });

    it('should have correct gender assignments', async () => {
      const result = await service.findAll();

      const genderMap = {
        cheerful: 'female',
        cool: 'male',
        cute: 'female',
      };

      result.characters.forEach((character) => {
        expect(character.gender).toBe(
          genderMap[character.persona as keyof typeof genderMap],
        );
      });
    });

    it('should have valid model configuration values', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        // Scale should be positive number
        expect(character.modelConfig.scale).toBeGreaterThan(0);
        expect(typeof character.modelConfig.scale).toBe('number');

        // Position should have x, y, z coordinates
        expect(character.modelConfig.position).toHaveProperty('x');
        expect(character.modelConfig.position).toHaveProperty('y');
        expect(character.modelConfig.position).toHaveProperty('z');
        expect(typeof character.modelConfig.position.x).toBe('number');
        expect(typeof character.modelConfig.position.y).toBe('number');
        expect(typeof character.modelConfig.position.z).toBe('number');

        // Avatar settings should be boolean values
        expect(typeof character.modelConfig.avatarSettings.shadows).toBe(
          'boolean',
        );
        expect(typeof character.modelConfig.avatarSettings.antialias).toBe(
          'boolean',
        );
        expect(typeof character.modelConfig.avatarSettings.autoRotate).toBe(
          'boolean',
        );
      });
    });

    it('should have unique IDs for each character', async () => {
      const result = await service.findAll();

      const ids = result.characters.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have descriptive character names', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        expect(character.name.length).toBeGreaterThan(5);
        expect(character.description.length).toBeGreaterThan(20);
      });
    });

    it('should return consistent data structure on multiple calls', async () => {
      const result1 = await service.findAll();
      const result2 = await service.findAll();

      expect(result1).toEqual(result2);
    });

    it('should use GLTF format for all model and animation files', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        // Model should be .gltf
        expect(character.modelConfig.modelUrl).toMatch(/\.gltf$/);

        // All animations should be .gltf
        Object.values(character.modelConfig.animations).forEach((url) => {
          expect(url).toMatch(/\.gltf$/);
        });
      });
    });

    it('should use PNG format for thumbnail and preview images', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        expect(character.modelConfig.thumbnailUrl).toMatch(/\.png$/);
        expect(character.modelConfig.previewUrl).toMatch(/\.png$/);
      });
    });

    it('should have voice speed within valid range (0.25-4.0)', async () => {
      const result = await service.findAll();

      result.characters.forEach((character) => {
        expect(character.voiceConfig.speed).toBeGreaterThanOrEqual(0.25);
        expect(character.voiceConfig.speed).toBeLessThanOrEqual(4.0);
      });
    });

    it('should support multi-language voice configuration', async () => {
      const result = await service.findAll();

      const validLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];

      result.characters.forEach((character) => {
        expect(validLanguages).toContain(character.voiceConfig.language);
      });
    });
  });

  describe('CDN URL construction', () => {
    it('should handle CDN URLs with trailing slash', async () => {
      const moduleWithTrailingSlash = await Test.createTestingModule({
        providers: [
          CharacterService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'CDN_BASE_URL') {
                  return 'https://cdn.example.com/models/'; // Trailing slash
                }
              }),
            },
          },
        ],
      }).compile();

      const serviceWithSlash =
        moduleWithTrailingSlash.get<CharacterService>(CharacterService);
      const result = await serviceWithSlash.findAll();

      // URL should not have double slashes
      result.characters.forEach((character) => {
        expect(character.modelConfig.modelUrl).not.toMatch(/\/\//);
      });
    });
  });

  describe('Data validation', () => {
    it('should have valid persona values', async () => {
      const result = await service.findAll();

      const validPersonas = ['cheerful', 'cool', 'cute'];

      result.characters.forEach((character) => {
        expect(validPersonas).toContain(character.persona);
      });
    });

    it('should have valid gender values', async () => {
      const result = await service.findAll();

      const validGenders = ['male', 'female', 'neutral'];

      result.characters.forEach((character) => {
        expect(validGenders).toContain(character.gender);
      });
    });
  });
});
