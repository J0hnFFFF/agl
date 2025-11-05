import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Character Configuration Loader
 *
 * Loads character data from JSON configuration file instead of hardcoding.
 * Supports CDN URL injection and animation generation.
 */
@Injectable()
export class CharacterLoader implements OnModuleInit {
  private readonly logger = new Logger(CharacterLoader.name);
  private charactersConfig: any;
  private readonly cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.cdnBaseUrl = this.configService.get<string>(
      'CDN_BASE_URL',
      'https://cdn.example.com/agl/models'
    );
  }

  async onModuleInit() {
    await this.loadCharactersConfig();
  }

  /**
   * Load characters configuration from JSON file
   */
  private async loadCharactersConfig() {
    try {
      const configPath = path.join(
        process.cwd(),
        'config',
        'characters.json'
      );

      this.logger.log(`Loading characters config from ${configPath}`);

      const fileContent = fs.readFileSync(configPath, 'utf8');
      this.charactersConfig = JSON.parse(fileContent);

      this.logger.log(
        `Loaded ${this.charactersConfig.characters.length} characters`
      );
    } catch (error) {
      this.logger.error(`Failed to load characters config: ${error.message}`);
      throw new Error('Characters configuration not found');
    }
  }

  /**
   * Get all characters with CDN URLs injected
   */
  getCharacters() {
    return this.charactersConfig.characters.map((char: any) =>
      this.enhanceWithCdnUrls(char)
    );
  }

  /**
   * Enhance character with CDN URLs and animation mappings
   */
  private enhanceWithCdnUrls(character: any) {
    const { persona } = character;
    const animations = this.generateAnimationUrls(persona);

    return {
      ...character,
      modelConfig: {
        modelUrl: `${this.cdnBaseUrl}/${persona}/model.gltf`,
        thumbnailUrl: `${this.cdnBaseUrl}/${persona}/thumbnail.png`,
        previewUrl: `${this.cdnBaseUrl}/${persona}/preview.png`,
        scale: character.model.scale,
        position: character.model.position,
        animations,
        avatarSettings: character.model.avatarSettings,
      },
      voiceConfig: character.voice,
    };
  }

  /**
   * Generate 37 animation URLs (1 idle + 36 emotion variants)
   */
  private generateAnimationUrls(persona: string): Record<string, string> {
    const animations: Record<string, string> = {};
    const { emotions, intensities } = this.charactersConfig.animations;

    // Idle animation
    animations.idle = `${this.cdnBaseUrl}/${persona}/animations/idle.gltf`;

    // Generate emotion variants (12 emotions × 3 intensities = 36)
    for (const emotion of emotions) {
      for (const intensity of intensities) {
        const key = `${emotion}_${intensity}`;
        animations[key] = `${this.cdnBaseUrl}/${persona}/animations/${key}.gltf`;
      }
    }

    return animations;
  }
}
