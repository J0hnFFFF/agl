/**
 * Vision Analysis System
 * Integrates with GPT-4V and Claude Vision for image analysis
 */

import axios from 'axios';
import type {
  VisionConfig,
  VisionRequest,
  VisionResponse,
  Screenshot,
  VisionProvider,
  VisionEventHandlers,
} from '../types';

/**
 * VisionAnalyzer - Main vision analysis class
 *
 * @example
 * ```ts
 * const analyzer = new VisionAnalyzer({
 *   provider: 'openai-gpt4v',
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4-vision-preview'
 * });
 *
 * const response = await analyzer.analyze({
 *   screenshot,
 *   prompt: 'What is happening in this game scene?'
 * });
 * ```
 */
export class VisionAnalyzer {
  private config: VisionConfig;
  private handlers: VisionEventHandlers;

  constructor(config: VisionConfig, handlers: VisionEventHandlers = {}) {
    this.config = this.normalizeConfig(config);
    this.handlers = handlers;
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(config: VisionConfig): VisionConfig {
    // Validate apiKey
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('VisionConfig.apiKey is required and cannot be empty');
    }

    // Validate and set temperature
    const temperature = config.temperature !== undefined ? config.temperature : 0.7;
    if (temperature < 0 || temperature > 1) {
      throw new Error(`VisionConfig.temperature must be between 0 and 1, got ${temperature}`);
    }

    // Validate and set maxTokens
    const maxTokens = config.maxTokens !== undefined ? config.maxTokens : 1000;
    if (maxTokens < 1 || maxTokens > 100000) {
      throw new Error(`VisionConfig.maxTokens must be between 1 and 100000, got ${maxTokens}`);
    }

    return {
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model || this.getDefaultModel(config.provider),
      maxTokens,
      temperature,
      apiEndpoint: config.apiEndpoint || this.getDefaultEndpoint(config.provider),
      timeout: config.timeout || 30000, // Default 30 seconds
    };
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: VisionProvider): string {
    const defaults: Record<VisionProvider, string> = {
      'openai-gpt4v': 'gpt-4-vision-preview',
      'anthropic-claude': 'claude-3-opus-20240229',
      custom: '',
    };
    return defaults[provider];
  }

  /**
   * Get default API endpoint for provider
   */
  private getDefaultEndpoint(provider: VisionProvider): string {
    const endpoints: Record<VisionProvider, string> = {
      'openai-gpt4v': 'https://api.openai.com/v1/chat/completions',
      'anthropic-claude': 'https://api.anthropic.com/v1/messages',
      custom: '',
    };
    return endpoints[provider];
  }

  /**
   * Analyze a screenshot
   */
  async analyze(request: VisionRequest): Promise<VisionResponse> {
    const startTime = Date.now();

    try {
      const response = await this.analyzeWithProvider(request);

      const result: VisionResponse = {
        ...response,
        processingTime: Date.now() - startTime,
      };

      this.handlers.onAnalysisComplete?.(result);

      if (result.gameState) {
        this.handlers.onGameStateDetected?.(result.gameState);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handlers.onAnalysisError?.(err);
      throw err;
    }
  }

  /**
   * Route to appropriate provider
   */
  private async analyzeWithProvider(request: VisionRequest): Promise<VisionResponse> {
    switch (this.config.provider) {
      case 'openai-gpt4v':
        return this.analyzeWithOpenAI(request);
      case 'anthropic-claude':
        return this.analyzeWithClaude(request);
      case 'custom':
        throw new Error('Custom provider not implemented. Use analyzeWithCustom()');
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Analyze with OpenAI GPT-4V
   */
  private async analyzeWithOpenAI(request: VisionRequest): Promise<VisionResponse> {
    const { screenshot, prompt, context } = request;

    const messages = [];

    // Add context if provided
    if (context) {
      messages.push({
        role: 'system',
        content: context,
      });
    }

    // Add user message with image
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/${screenshot.format};base64,${screenshot.data}`,
            detail: 'high',
          },
        },
      ],
    });

    const response = await axios.post(
      this.config.apiEndpoint!,
      {
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: this.config.timeout,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    const tokensUsed =
      (response.data.usage?.prompt_tokens || 0) + (response.data.usage?.completion_tokens || 0);

    return {
      content,
      confidence: 0.8, // GPT-4V doesn't provide confidence scores
      processingTime: 0, // Will be set by caller
      tokensUsed,
      raw: response.data,
    };
  }

  /**
   * Analyze with Anthropic Claude
   */
  private async analyzeWithClaude(request: VisionRequest): Promise<VisionResponse> {
    const { screenshot, prompt, context } = request;

    const content: any[] = [];

    // Add image
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: `image/${screenshot.format}`,
        data: screenshot.data,
      },
    });

    // Add prompt
    content.push({
      type: 'text',
      text: prompt,
    });

    const messages = [
      {
        role: 'user',
        content,
      },
    ];

    const response = await axios.post(
      this.config.apiEndpoint!,
      {
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: context || undefined,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        timeout: this.config.timeout,
      }
    );

    const responseContent = response.data.content?.[0]?.text || '';
    const tokensUsed =
      (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0);

    return {
      content: responseContent,
      confidence: 0.8, // Claude doesn't provide confidence scores
      processingTime: 0, // Will be set by caller
      tokensUsed,
      raw: response.data,
    };
  }

  /**
   * Analyze with custom provider
   */
  async analyzeWithCustom(
    request: VisionRequest,
    customFn: (request: VisionRequest, config: VisionConfig) => Promise<VisionResponse>
  ): Promise<VisionResponse> {
    const startTime = Date.now();

    try {
      const response = await customFn(request, this.config);

      const result: VisionResponse = {
        ...response,
        processingTime: Date.now() - startTime,
      };

      this.handlers.onAnalysisComplete?.(result);

      if (result.gameState) {
        this.handlers.onGameStateDetected?.(result.gameState);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handlers.onAnalysisError?.(err);
      throw err;
    }
  }

  /**
   * Quick analyze - simplified interface
   */
  async quickAnalyze(screenshot: Screenshot, question: string): Promise<string> {
    const response = await this.analyze({
      screenshot,
      prompt: question,
    });

    return response.content;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VisionConfig>): void {
    this.config = this.normalizeConfig({ ...this.config, ...config } as VisionConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): VisionConfig {
    return { ...this.config };
  }
}
