# @agl/vision 生产环境修复清单

**基于审计报告的关键修复项**

---

## 🔴 Phase 1: 紧急修复（生产阻塞）

### 修复 #1: 类型定义与实现不匹配

**文件**: `src/types/index.ts`, `README.md`

**问题**:
```typescript
// 当前定义
export type CaptureSource = 'canvas' | 'video' | 'display' | 'window' | 'custom';
// 'custom' 未实现，会导致运行时错误
```

**修复方案**:
```typescript
// 选项 A: 移除未实现的类型（推荐）
export type CaptureSource = 'canvas' | 'video' | 'display' | 'window';

// 选项 B: 如果未来需要自定义源
export interface CaptureConfig {
  source: CaptureSource;
  target?: HTMLCanvasElement | HTMLVideoElement | string;
  /**
   * Custom capture function (only used when source is 'custom')
   * @experimental
   */
  customCaptureFn?: () => Promise<Screenshot>;
}
```

**测试**:
```typescript
// 添加测试
it('should throw error for unsupported capture source', async () => {
  const config: any = { source: 'unsupported' };
  const capture = new ScreenCapture(config);
  await expect(capture.capture()).rejects.toThrow('Unsupported capture source');
});
```

---

### 修复 #2: 添加输入验证

**文件**: `src/analysis/VisionAnalyzer.ts`, `src/capture/ScreenCapture.ts`

**VisionAnalyzer 验证**:
```typescript
private normalizeConfig(config: VisionConfig): VisionConfig {
  // 验证 apiKey
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('VisionConfig.apiKey is required and cannot be empty');
  }

  // 验证 temperature
  const temperature = config.temperature !== undefined ? config.temperature : 0.7;
  if (temperature < 0 || temperature > 1) {
    throw new Error('VisionConfig.temperature must be between 0 and 1, got ' + temperature);
  }

  // 验证 maxTokens
  const maxTokens = config.maxTokens || 1000;
  if (maxTokens < 1 || maxTokens > 100000) {
    throw new Error('VisionConfig.maxTokens must be between 1 and 100000, got ' + maxTokens);
  }

  return {
    provider: config.provider,
    apiKey: config.apiKey,
    model: config.model || this.getDefaultModel(config.provider),
    maxTokens,
    temperature,
    apiEndpoint: config.apiEndpoint || this.getDefaultEndpoint(config.provider),
  };
}
```

**ScreenCapture 验证**:
```typescript
private normalizeConfig(config: CaptureConfig): CaptureConfig & {
  format: ImageFormat;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  interval: number;
  autoCapture: boolean;
} {
  // 验证 quality
  const quality = config.quality !== undefined ? config.quality : 0.8;
  if (quality < 0 || quality > 1) {
    throw new Error('CaptureConfig.quality must be between 0 and 1, got ' + quality);
  }

  // 验证 maxWidth/maxHeight
  const maxWidth = config.maxWidth || 1920;
  const maxHeight = config.maxHeight || 1080;
  if (maxWidth < 1 || maxWidth > 7680) {
    throw new Error('CaptureConfig.maxWidth must be between 1 and 7680, got ' + maxWidth);
  }
  if (maxHeight < 1 || maxHeight > 4320) {
    throw new Error('CaptureConfig.maxHeight must be between 1 and 4320, got ' + maxHeight);
  }

  // 验证 interval
  const interval = config.interval || 1000;
  if (interval < 100) {
    throw new Error('CaptureConfig.interval must be at least 100ms, got ' + interval);
  }

  return {
    source: config.source,
    target: config.target,
    format: config.format || 'jpeg',
    quality,
    maxWidth,
    maxHeight,
    interval,
    autoCapture: config.autoCapture || false,
  };
}
```

**测试**:
```typescript
// VisionAnalyzer.test.ts
describe('input validation', () => {
  it('should throw error for empty apiKey', () => {
    expect(() => {
      new VisionAnalyzer({ provider: 'openai-gpt4v', apiKey: '' });
    }).toThrow('apiKey is required');
  });

  it('should throw error for invalid temperature', () => {
    expect(() => {
      new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'test',
        temperature: 2.0
      });
    }).toThrow('temperature must be between 0 and 1');
  });
});

// ScreenCapture.test.ts
describe('input validation', () => {
  it('should throw error for invalid quality', () => {
    expect(() => {
      new ScreenCapture({
        source: 'canvas',
        target: mockCanvas,
        quality: 1.5
      });
    }).toThrow('quality must be between 0 and 1');
  });
});
```

---

### 修复 #3: 提升测试覆盖率

**目标**: 分支覆盖率从 75.89% 提升到 80%+

**需要添加的测试**:

**tests/ScreenCapture.test.ts**:
```typescript
describe('auto-capture error handling', () => {
  it('should call onError when capture fails during auto-capture', async () => {
    jest.useFakeTimers();
    const onError = jest.fn();

    global.document.querySelector = jest.fn()
      .mockReturnValueOnce(new MockHTMLCanvasElement()) // First call succeeds
      .mockReturnValueOnce(null); // Second call fails

    const capture = new ScreenCapture({
      source: 'canvas',
      target: '#canvas'
    }, { onError });

    capture.startAutoCapture(jest.fn());

    // First capture succeeds
    await jest.advanceTimersByTimeAsync(0);
    expect(onError).not.toHaveBeenCalled();

    // Second capture fails
    await jest.advanceTimersByTimeAsync(1000);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    capture.stopAutoCapture();
    jest.useRealTimers();
  });
});

describe('unsupported capture sources', () => {
  it('should throw error for custom source without implementation', async () => {
    const config: any = {
      source: 'custom'
    };

    const capture = new ScreenCapture(config);
    await expect(capture.capture()).rejects.toThrow('Unsupported capture source: custom');
  });
});
```

**tests/VisionAnalyzer.test.ts**:
```typescript
describe('network error handling', () => {
  it('should handle network timeout', async () => {
    const analyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: 'test-key'
    });

    mockedAxios.post.mockRejectedValueOnce(new Error('Network timeout'));

    await expect(analyzer.analyze({
      screenshot: mockScreenshot,
      prompt: 'test'
    })).rejects.toThrow('Network timeout');
  });

  it('should handle API rate limit', async () => {
    const analyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: 'test-key'
    });

    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 429, data: { error: 'Rate limit exceeded' } }
    });

    await expect(analyzer.analyze({
      screenshot: mockScreenshot,
      prompt: 'test'
    })).rejects.toThrow();
  });
});
```

---

### 修复 #4: 同步文档与代码

**文件**: `README.md`

**更新特性列表**:
```markdown
## Features

- **Screen Capture**: Capture from Canvas, Video, Display, Window (Screen Capture API)
- **Vision AI Integration**: GPT-4V (OpenAI) and Claude Vision (Anthropic)
- **Game State Recognition**: Automatic detection of 12 game states
- **Flexible Analysis**: Custom prompts and structured responses
- **Performance Optimized**: Configurable quality, resolution, intervals
- **TypeScript**: Full type safety
- **Game Engine Plugins**: Unity (C#) and Unreal Engine (C++)

## Supported Capture Sources

| Source | Description | Platform |
|--------|-------------|----------|
| `canvas` | HTML Canvas element | Browser |
| `video` | HTML Video element | Browser |
| `display` | Screen Capture API | Browser (requires HTTPS) |
| `window` | Alias for `display` | Browser |

**Note**: Custom capture sources are not yet implemented. Use the built-in sources or contact us for custom requirements.
```

**添加限制说明**:
```markdown
## Limitations

### API Limits
- **OpenAI GPT-4V**:
  - Rate limit: 50 requests/min (varies by tier)
  - Max image size: 20MB
  - Cost: ~$0.01-0.03 per image

- **Anthropic Claude Vision**:
  - Rate limit: 40 requests/min
  - Max image size: 10MB
  - Cost: ~$0.015-0.04 per image

### Browser Compatibility
- Chrome/Edge: 91+ (full support)
- Firefox: 88+ (no display capture in incognito)
- Safari: 15+ (requires user permission)

### Image Size
- Recommended: 1920x1080 or smaller
- Maximum: 3840x2160 (will be resized automatically)
- Larger images = higher cost and slower analysis
```

---

### 修复 #5: 添加 API 密钥安全警告

**文件**: `README.md`, `src/analysis/VisionAnalyzer.ts`

**README.md 添加安全警告**:
```markdown
## Security

### ⚠️ API Key Security Warning

**NEVER expose your API keys in client-side code!**

```typescript
// ❌ UNSAFE - DO NOT DO THIS
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: 'sk-...' // Exposed in browser console!
});

// ✅ SAFE - Use environment variables in Node.js
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ SAFE - Use backend proxy in browser
const analyzer = new VisionAnalyzer({
  provider: 'custom',
  apiKey: 'not-used',
  apiEndpoint: '/api/vision' // Your backend endpoint
});
```

### Backend Proxy Example

**Backend (Node.js/Express)**:
```javascript
import OpenAI from 'openai';
import express from 'express';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/vision', async (req, res) => {
  const { screenshot, prompt } = req.body;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshot.data}` } }
      ]
    }]
  });

  res.json({ content: response.choices[0].message.content });
});
```

**Frontend**:
```typescript
const analyzer = new VisionAnalyzer({
  provider: 'custom',
  apiKey: 'not-used',
  apiEndpoint: '/api/vision'
});

await analyzer.analyzeWithCustom(request, async (req, config) => {
  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screenshot: req.screenshot,
      prompt: req.prompt
    })
  });

  const data = await response.json();
  return {
    content: data.content,
    confidence: 0.8,
    processingTime: 0
  };
});
```
```

**VisionAnalyzer.ts 添加运行时警告**:
```typescript
constructor(config: VisionConfig, handlers: VisionEventHandlers = {}) {
  this.config = this.normalizeConfig(config);
  this.handlers = handlers;

  // 安全警告
  if (typeof window !== 'undefined' &&
      (config.apiKey.startsWith('sk-') || config.apiKey.startsWith('sk-ant-'))) {
    console.warn(
      '[AGL Vision Security Warning] API key detected in browser environment.\n' +
      'API keys should NEVER be exposed in client-side code.\n' +
      'Consider using a backend proxy. See documentation: https://docs.agl.com/vision/security'
    );
  }
}
```

---

## 🟡 Phase 2: 生产准备（建议修复）

### 修复 #6: 移除未实现的类型导出

**文件**: `src/index.ts`, `src/types/index.ts`

**当前导出**:
```typescript
export type {
  // ...
  BatchAnalysisRequest,      // ❌ 未实现
  BatchAnalysisResponse,     // ❌ 未实现
  CacheConfig,               // ❌ 未实现
  PerformanceMetrics,        // ❌ 未实现
} from './types';
```

**修复方案 A - 移除导出**:
```typescript
// src/index.ts
export type {
  // Capture types
  CaptureSource,
  ImageFormat,
  CaptureConfig,
  Screenshot,
  CaptureEventHandlers,

  // Vision types
  VisionProvider,
  VisionConfig,
  VisionRequest,
  VisionResponse,
  VisionEventHandlers,

  // Game state types
  GameStateCategory,
  GameState,
  UIElement,
  GameEntity,
  BoundingBox,

  // Analysis types
  PromptTemplate,

  // 移除这些:
  // BatchAnalysisRequest,
  // BatchAnalysisResponse,
  // CacheConfig,
  // PerformanceMetrics,
} from './types';
```

**修复方案 B - 添加 @experimental 标记**:
```typescript
// src/types/index.ts
/**
 * Batch analysis request
 * @experimental Not yet implemented. Planned for v0.2.0
 */
export interface BatchAnalysisRequest {
  // ...
}
```

**推荐**: 方案 A（移除导出）

---

### 修复 #7: 添加网络超时配置

**文件**: `src/analysis/VisionAnalyzer.ts`

**添加超时配置**:
```typescript
export interface VisionConfig {
  provider: VisionProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiEndpoint?: string;
  /** Network timeout in milliseconds (default: 30000) */
  timeout?: number;
}
```

**在 API 调用中使用**:
```typescript
private async analyzeWithOpenAI(request: VisionRequest): Promise<VisionResponse> {
  const { screenshot, prompt, context } = request;

  // ...messages setup...

  const response = await axios.post(
    this.config.apiEndpoint!,
    { model: this.config.model, messages, max_tokens: this.config.maxTokens },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      timeout: this.config.timeout || 30000, // 30 秒默认超时
      validateStatus: (status) => status < 500, // 处理 4xx 错误
    }
  );

  // 处理特定错误
  if (response.status === 429) {
    throw new Error(
      'API rate limit exceeded. Please try again later or reduce request frequency.'
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('Invalid API key. Please check your credentials.');
  }
  if (response.status >= 400) {
    throw new Error(`API error: ${response.status} - ${response.statusText}`);
  }

  // ...rest of implementation...
}
```

---

### 修复 #8: 实现速率限制保护

**新文件**: `src/utils/RateLimiter.ts`

```typescript
export interface RateLimitConfig {
  /** Maximum requests per minute */
  maxRequestsPerMinute?: number;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
}

export class RateLimiter {
  private requestTimes: number[] = [];
  private activeRequests = 0;
  private maxRequestsPerMinute: number;
  private maxConcurrent: number;

  constructor(config: RateLimitConfig = {}) {
    this.maxRequestsPerMinute = config.maxRequestsPerMinute || 60;
    this.maxConcurrent = config.maxConcurrent || 5;
  }

  async acquire(): Promise<void> {
    // 等待并发限制
    while (this.activeRequests >= this.maxConcurrent) {
      await this.sleep(100);
    }

    // 等待速率限制
    while (this.isRateLimited()) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 60000 - (Date.now() - oldestRequest);
      await this.sleep(Math.max(waitTime, 100));
    }

    this.requestTimes.push(Date.now());
    this.activeRequests++;
  }

  release(): void {
    this.activeRequests--;
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    return this.requestTimes.length >= this.maxRequestsPerMinute;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**集成到 VisionAnalyzer**:
```typescript
export class VisionAnalyzer {
  private rateLimiter?: RateLimiter;

  constructor(
    config: VisionConfig & { rateLimit?: RateLimitConfig },
    handlers: VisionEventHandlers = {}
  ) {
    this.config = this.normalizeConfig(config);
    this.handlers = handlers;

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit);
    }
  }

  async analyze(request: VisionRequest): Promise<VisionResponse> {
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const startTime = Date.now();
    try {
      const response = await this.analyzeWithProvider(request);
      // ...
      return result;
    } catch (error) {
      throw error;
    } finally {
      if (this.rateLimiter) {
        this.rateLimiter.release();
      }
    }
  }
}
```

---

### 修复 #9: 添加图片大小限制

**文件**: `src/capture/ScreenCapture.ts`

```typescript
export interface CaptureConfig {
  source: CaptureSource;
  target?: HTMLCanvasElement | HTMLVideoElement | string;
  format?: ImageFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  interval?: number;
  autoCapture?: boolean;
  /** Maximum screenshot size in bytes (default: 10MB) */
  maxSize?: number;
}
```

**实现大小检查**:
```typescript
private canvasToScreenshot(canvas: HTMLCanvasElement): Screenshot {
  const resized = this.resizeCanvas(canvas);
  const mimeType = this.getMimeType(this.config.format);
  const dataUrl = resized.toDataURL(mimeType, this.config.quality);
  const base64Data = dataUrl.split(',')[1];
  const size = Math.ceil((base64Data.length * 3) / 4);

  // 检查大小限制
  const maxSize = this.config.maxSize || 10 * 1024 * 1024; // 10MB 默认
  if (size > maxSize) {
    const sizeMB = (size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
    throw new Error(
      `Screenshot size (${sizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB). ` +
      `Try reducing maxWidth, maxHeight, or quality settings.`
    );
  }

  return {
    data: base64Data,
    format: this.config.format,
    width: resized.width,
    height: resized.height,
    timestamp: Date.now(),
    size,
  };
}
```

---

### 修复 #10: 完善文档示例

**文件**: `README.md`

**添加错误处理部分**:
```markdown
## Error Handling

### Handling Capture Errors

```typescript
import { ScreenCapture } from '@agl/vision';

const capture = new ScreenCapture(
  {
    source: 'canvas',
    target: '#game-canvas',
  },
  {
    onError: (error) => {
      console.error('Capture failed:', error.message);

      if (error.message.includes('not a canvas')) {
        console.log('Canvas element not found. Check your selector.');
      } else if (error.message.includes('exceeds maximum')) {
        console.log('Image too large. Reduce quality or resolution.');
      }
    },
  }
);

try {
  const screenshot = await capture.capture();
  console.log('Captured successfully');
} catch (error) {
  console.error('Failed to capture:', error);
}
```

### Handling Analysis Errors

```typescript
import { VisionAnalyzer } from '@agl/vision';

const analyzer = new VisionAnalyzer(
  {
    provider: 'openai-gpt4v',
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
  },
  {
    onAnalysisError: (error) => {
      console.error('Analysis failed:', error.message);
    },
  }
);

try {
  const response = await analyzer.analyze({
    screenshot,
    prompt: 'What is happening?',
  });
  console.log('Analysis:', response.content);
} catch (error) {
  if (error.message.includes('rate limit')) {
    console.log('Rate limited. Wait and retry.');
    await sleep(60000);
    // Retry logic
  } else if (error.message.includes('Invalid API key')) {
    console.log('Check your API key configuration.');
  } else if (error.message.includes('timeout')) {
    console.log('Request timed out. Try again or increase timeout.');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Retry Logic

```typescript
async function analyzeWithRetry(
  analyzer: VisionAnalyzer,
  request: VisionRequest,
  maxRetries = 3
): Promise<VisionResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzer.analyze(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```
```

**添加环境配置部分**:
```markdown
## Environment Setup

### Development

Create a `.env` file in your project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Load environment variables:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### Production

**Option 1: Environment Variables**
```bash
# Set in your deployment platform
export OPENAI_API_KEY="sk-..."
```

**Option 2: Backend Proxy (Recommended)**
- Never expose API keys in client-side code
- Use a backend service to proxy requests
- Implement your own rate limiting and logging
- See [Backend Proxy Example](#backend-proxy-example) above
```

---

## 📋 修复检查清单

### Phase 1（紧急）

- [ ] 修复 #1: 类型定义不匹配
  - [ ] 更新 `CaptureSource` 类型
  - [ ] 更新文档
  - [ ] 添加测试

- [ ] 修复 #2: 输入验证
  - [ ] VisionAnalyzer 验证
  - [ ] ScreenCapture 验证
  - [ ] 添加测试

- [ ] 修复 #3: 测试覆盖率
  - [ ] Auto-capture 错误测试
  - [ ] 不支持源测试
  - [ ] 网络错误测试
  - [ ] 确认覆盖率 ≥ 80%

- [ ] 修复 #4: 文档同步
  - [ ] 更新特性列表
  - [ ] 添加限制说明
  - [ ] 更新示例

- [ ] 修复 #5: 安全警告
  - [ ] README 警告
  - [ ] 代码运行时警告
  - [ ] 后端代理示例

### Phase 2（建议）

- [ ] 修复 #6: 移除未实现类型
- [ ] 修复 #7: 网络超时
- [ ] 修复 #8: 速率限制
- [ ] 修复 #9: 图片大小限制
- [ ] 修复 #10: 文档示例

---

## 📊 预期结果

### 修复后指标

| 指标 | 修复前 | 目标 |
|------|--------|------|
| 测试覆盖率（分支） | 75.89% | ≥ 80% |
| 类型安全性 | 部分 | 完全 |
| 文档准确性 | 85% | 95% |
| 生产就绪度 | B 级 | A 级 |

### 发布计划

1. **v0.1.1-beta**: Phase 1 修复
2. **v0.1.1**: Phase 1 + 用户反馈修复
3. **v0.2.0**: Phase 2 修复

---

**预计总工作量**: 约 20 小时（2-3 天全职工作）
