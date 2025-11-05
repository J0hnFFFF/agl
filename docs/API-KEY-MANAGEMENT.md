# API Key Management Guide

**AGL Platform API Key Security and Management**

## 概述

AGL 平台使用 API Key 进行服务间认证和访问控制。本文档说明 API Key 的生成、管理、轮换和安全最佳实践。

---

## API Key 类型

### 1. Client API Keys (客户端密钥)
用于游戏开发者访问 AGL API 服务。

**权限范围**:
- 情感识别 API
- 对话生成 API
- 记忆管理 API
- 角色配置 API

**存储位置**: `clients` 表 `api_key` 字段

### 2. Dashboard API Keys (仪表板密钥)
用于 Dashboard 访问 Analytics API。

**权限范围**:
- Analytics API (只读)
- 平台统计
- 成本分析

**存储位置**: 环境变量 `DASHBOARD_API_KEY`

### 3. Service-to-Service Keys (服务间密钥)
用于内部服务间通信。

**权限范围**:
- 完全访问（内部网络）

**存储位置**: 环境变量或 Kubernetes Secrets

---

## API Key 生成

### 标准格式

```
agl_<type>_<random_32_chars>
```

**示例**:
```
agl_client_4f8a3b2c1d9e7f6a5b4c3d2e1f0a9b8c
agl_dashboard_9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b
agl_internal_2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f
```

### 生成方法

```typescript
// TypeScript (API Service)
import * as crypto from 'crypto';

function generateApiKey(type: 'client' | 'dashboard' | 'internal'): string {
  const randomBytes = crypto.randomBytes(16);
  const randomHex = randomBytes.toString('hex');
  return `agl_${type}_${randomHex}`;
}

// 生成 SHA256 哈希（存储到数据库）
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
```

```bash
# Bash (快速生成)
echo "agl_client_$(openssl rand -hex 16)"
```

### Prisma Schema

```prisma
model Client {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  apiKey    String   @unique @map("api_key")  // SHA256 哈希
  tier      Tier     @default(FREE)

  // API Key 元数据
  apiKeyCreatedAt DateTime @default(now()) @map("api_key_created_at")
  apiKeyExpiresAt DateTime? @map("api_key_expires_at")
  apiKeyLastUsed  DateTime? @map("api_key_last_used")

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## API Key 验证

### NestJS Guard 实现

```typescript
// src/auth/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    // 哈希 API Key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // 查询数据库
    const client = await this.prisma.client.findUnique({
      where: { apiKey: hashedKey },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!client.isActive) {
      throw new UnauthorizedException('API key is inactive');
    }

    // 检查过期时间
    if (client.apiKeyExpiresAt && client.apiKeyExpiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // 更新最后使用时间（异步，不阻塞请求）
    this.updateLastUsed(client.id).catch(() => {});

    // 将 client 信息附加到 request
    request['client'] = client;

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // 支持多种方式传递 API Key
    const headerKey = request.headers['x-api-key'] as string;
    const authHeader = request.headers.authorization as string;

    if (headerKey) {
      return headerKey;
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  private async updateLastUsed(clientId: string): Promise<void> {
    await this.prisma.client.update({
      where: { id: clientId },
      data: { apiKeyLastUsed: new Date() },
    });
  }
}
```

### 使用方式

```typescript
// 在 controller 中使用
@Controller('analytics')
@UseGuards(ApiKeyGuard)  // 保护整个 controller
export class AnalyticsController {
  @Get('platform')
  async getPlatformStats(@Req() request: Request) {
    const client = request['client'];  // 获取认证的客户端
    // ...
  }
}

// 或保护单个路由
@Get('sensitive-data')
@UseGuards(ApiKeyGuard)
async getSensitiveData() {
  // ...
}
```

---

## API Key 轮换

### 为什么需要轮换？

1. **定期安全维护**（建议每 90 天）
2. **密钥泄露后立即轮换**
3. **员工离职**
4. **合规要求**（如 SOC 2, ISO 27001）

### 轮换流程

#### 步骤 1: 生成新密钥（双密钥期）

```typescript
// services/api-service/src/client/client.service.ts
async rotateApiKey(clientId: string): Promise<{ oldKey: string, newKey: string }> {
  // 生成新密钥
  const newApiKey = generateApiKey('client');
  const hashedNewKey = hashApiKey(newApiKey);

  // 保存旧密钥到临时字段（双密钥期）
  const client = await this.prisma.client.findUnique({ where: { id: clientId } });

  await this.prisma.client.update({
    where: { id: clientId },
    data: {
      apiKeyOld: client.apiKey,  // 保存旧密钥
      apiKey: hashedNewKey,       // 设置新密钥
      apiKeyCreatedAt: new Date(),
      apiKeyRotatedAt: new Date(),
    },
  });

  // 返回明文密钥（只显示一次）
  return {
    oldKey: '***masked***',  // 不返回旧密钥明文
    newKey: newApiKey,
  };
}
```

#### 步骤 2: 通知客户（双密钥期 7-30 天）

```typescript
// 发送邮件通知
await this.emailService.send({
  to: client.email,
  subject: 'AGL API Key Rotation Required',
  template: 'api-key-rotation',
  data: {
    clientName: client.name,
    newApiKey: newApiKey,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days
    migrateUrl: 'https://dashboard.agl.example.com/settings/api-keys',
  },
});
```

#### 步骤 3: 验证时支持双密钥

```typescript
// 修改 ApiKeyGuard，在双密钥期同时接受新旧密钥
async canActivate(context: ExecutionContext): Promise<boolean> {
  const apiKey = this.extractApiKey(request);
  const hashedKey = hashApiKey(apiKey);

  // 尝试新密钥
  let client = await this.prisma.client.findUnique({ where: { apiKey: hashedKey } });

  // 如果新密钥失败，尝试旧密钥
  if (!client) {
    client = await this.prisma.client.findUnique({ where: { apiKeyOld: hashedKey } });

    if (client) {
      // 使用旧密钥，记录警告
      logger.warn(`Client ${client.id} using deprecated API key`);
    }
  }

  // ...
}
```

#### 步骤 4: 过期后禁用旧密钥

```typescript
// Cron job: 每天检查并禁用过期的旧密钥
@Cron('0 0 * * *')  // 每天凌晨
async disableExpiredOldKeys() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await this.prisma.client.updateMany({
    where: {
      apiKeyRotatedAt: { lt: thirtyDaysAgo },
      apiKeyOld: { not: null },
    },
    data: {
      apiKeyOld: null,  // 删除旧密钥
    },
  });

  logger.info('Expired old API keys removed');
}
```

---

## 安全最佳实践

### 1. 存储安全

✅ **正确做法**:
```typescript
// 存储 SHA256 哈希
const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
await prisma.client.create({ data: { apiKey: hashedKey } });
```

❌ **错误做法**:
```typescript
// 永远不要存储明文 API Key
await prisma.client.create({ data: { apiKey: plainApiKey } });  // 危险！
```

### 2. 传输安全

✅ **正确做法**:
```bash
# 使用 HTTPS
curl -H "X-API-Key: agl_client_xxx" https://api.agl.example.com/v1/analyze

# 或 Authorization header
curl -H "Authorization: Bearer agl_client_xxx" https://api.agl.example.com/v1/analyze
```

❌ **错误做法**:
```bash
# 不要在 URL 中传递 API Key
curl https://api.agl.example.com/v1/analyze?api_key=xxx  # 会记录到日志！
```

### 3. 日志安全

✅ **正确做法**:
```typescript
// 脱敏日志
logger.info(`API request from client ${client.id} (key: ${apiKey.substring(0, 10)}***)`);
```

❌ **错误做法**:
```typescript
// 不要记录完整 API Key
logger.info(`API request with key: ${apiKey}`);  // 危险！
```

### 4. 环境变量安全

✅ **正确做法**:
```bash
# .env 文件（添加到 .gitignore）
DASHBOARD_API_KEY=agl_dashboard_xxx

# 生产环境使用 Secrets Manager
# AWS Secrets Manager, Kubernetes Secrets, etc.
```

❌ **错误做法**:
```typescript
// 不要硬编码
const API_KEY = 'agl_client_xxx';  // 危险！会提交到 Git
```

### 5. 权限最小化

```typescript
// 不同类型的 API Key 应有不同权限
enum ApiKeyPermission {
  READ_ANALYTICS = 'analytics:read',
  WRITE_EVENTS = 'events:write',
  MANAGE_CHARACTERS = 'characters:manage',
  ADMIN = 'admin:*',
}

// 检查权限
function checkPermission(client: Client, permission: ApiKeyPermission): boolean {
  return client.permissions.includes(permission) || client.permissions.includes('admin:*');
}
```

---

## 监控和告警

### 1. 异常检测

```typescript
// 检测异常 API 使用模式
@Cron('*/5 * * * *')  // 每 5 分钟
async detectAnomalies() {
  // 短时间内大量请求
  const highFrequencyClients = await this.prisma.client.findMany({
    where: {
      apiKeyLastUsed: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      // 假设有请求计数字段
      requestCountLast5Min: { gt: 1000 },
    },
  });

  for (const client of highFrequencyClients) {
    await this.alertService.send({
      level: 'warning',
      message: `Client ${client.name} has high request frequency`,
      clientId: client.id,
    });
  }

  // 未使用的 API Key（可能泄露）
  const staleKeys = await this.prisma.client.findMany({
    where: {
      apiKeyLastUsed: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      isActive: true,
    },
  });

  // 建议轮换
  for (const client of staleKeys) {
    await this.emailService.sendApiKeyRotationReminder(client);
  }
}
```

### 2. 审计日志

```typescript
// 记录所有 API Key 使用
await this.prisma.apiKeyAuditLog.create({
  data: {
    clientId: client.id,
    endpoint: request.path,
    method: request.method,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    timestamp: new Date(),
    success: true,
  },
});
```

### 3. Prometheus Metrics

```typescript
// API Key 使用指标
const apiKeyUsageCounter = new Counter({
  name: 'agl_api_key_usage_total',
  help: 'Total API requests by client',
  labelNames: ['client_id', 'tier', 'endpoint'],
});

apiKeyUsageCounter.labels(client.id, client.tier, request.path).inc();
```

---

## 应急响应

### API Key 泄露应急流程

1. **立即禁用密钥**:
```typescript
await this.prisma.client.update({
  where: { id: clientId },
  data: { isActive: false },
});
```

2. **通知客户**:
```typescript
await this.emailService.sendSecurityAlert({
  to: client.email,
  subject: '[URGENT] API Key Security Alert',
  message: 'Your API key has been disabled due to suspected compromise.',
});
```

3. **生成新密钥**:
```typescript
const newKey = await this.rotateApiKey(clientId);
await this.emailService.sendNewApiKey(client.email, newKey.newKey);
```

4. **审查日志**:
```sql
SELECT * FROM api_key_audit_log
WHERE client_id = 'xxx'
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

5. **更新客户端**:
客户需要更新代码中的 API Key。

---

## 合规和审计

### SOC 2 / ISO 27001 要求

- ✅ API Key 必须哈希存储
- ✅ 定期轮换（90 天）
- ✅ 访问日志记录（至少 1 年）
- ✅ 异常检测和告警
- ✅ 密钥泄露应急预案

### 审计检查清单

```
□ 所有 API Key 已哈希存储（SHA256）
□ 没有 API Key 存储在代码仓库中
□ 所有 API 端点使用 HTTPS
□ API Key 不在 URL 参数中传递
□ 日志中 API Key 已脱敏
□ 有 API Key 轮换计划
□ 有异常检测机制
□ 有密钥泄露应急预案
□ 审计日志保留 >= 1 年
```

---

## 总结

### 关键原则

1. **永远不要存储明文 API Key**（使用 SHA256 哈希）
2. **永远不要在代码中硬编码 API Key**（使用环境变量）
3. **永远不要在日志中记录完整 API Key**（脱敏）
4. **定期轮换 API Key**（90 天）
5. **监控异常使用模式**（告警）

### 快速参考

| 操作 | 命令/代码 |
|------|----------|
| 生成 API Key | `generateApiKey('client')` |
| 验证 API Key | `@UseGuards(ApiKeyGuard)` |
| 轮换 API Key | `rotateApiKey(clientId)` |
| 禁用 API Key | `client.update({ isActive: false })` |
| 检查日志 | `SELECT * FROM api_key_audit_log` |

---

**保护 API Key = 保护用户数据 = 保护业务安全**
