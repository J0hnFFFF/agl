# AGL Implementation Patterns

## 概述 (Overview)

本文档总结了 AGL 项目中的核心架构模式和编码规范，用于指导 Phase 4B 功能的实现。

**核心原则**: 不破坏现有架构，严格遵循已建立的模式。

---

## 1. Python FastAPI Service 模式

### 1.1 目录结构

```
services/{service-name}/
├── app.py                     # FastAPI 入口点
├── requirements.txt           # Python 依赖
├── src/
│   ├── __init__.py
│   ├── config.py             # 配置管理 (pydantic-settings)
│   ├── models.py             # Pydantic 数据模型
│   ├── {service}_service.py  # 主服务逻辑
│   ├── cache.py              # Redis 缓存
│   ├── cost_tracker.py       # 成本追踪
│   └── [其他功能模块]
└── tests/
    ├── __init__.py
    ├── conftest.py           # Pytest fixtures
    ├── test_api.py           # API 集成测试
    ├── test_{module}.py      # 单元测试
    └── test_cache.py         # 缓存测试
```

### 1.2 配置管理 (config.py)

```python
"""
Configuration management for {Service} Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Service configuration"""

    # Service info
    service_name: str = "{service}-service"
    service_version: str = "0.1.0"

    # API keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # Feature flags
    {feature}_enabled: bool = True

    # Cost control
    max_cost_per_request: float = 0.01
    daily_budget: float = 50.0  # $50/day budget

    # Caching
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour in seconds

    # CORS
    cors_origin: str = "*"

    # Service port
    port: int = 8000

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


settings = Settings()
```

**要点**:
- 使用 `pydantic-settings.BaseSettings`
- 从 `../../.env` 加载环境变量
- 包含服务信息、API密钥、功能开关、成本限制、缓存配置
- 默认值应该合理，允许无配置快速启动

### 1.3 数据模型 (models.py)

```python
"""
Data models for {Service} Service
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from enum import Enum


class GenerationMethod(str, Enum):
    """Generation method used"""
    CACHED = "cached"
    PROVIDER_A = "provider_a"
    PROVIDER_B = "provider_b"


class ServiceRequest(BaseModel):
    """Request model"""
    input_field: str = Field(..., description="Required input field")
    optional_field: Optional[str] = Field(None, description="Optional field")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")
    force_provider: bool = Field(default=False, description="Force specific provider (debug only)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "input_field": "example value",
                    "optional_field": "optional",
                    "context": {"key": "value"}
                }
            ]
        }
    }


class ServiceResponse(BaseModel):
    """Response model"""
    result: str = Field(..., description="Service result")
    method: GenerationMethod = Field(..., description="Method used")
    cost: float = Field(default=0.0, description="Cost in USD")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    latency_ms: float = Field(default=0.0, description="Processing latency in milliseconds")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "result": "service output",
                    "method": "cached",
                    "cost": 0.0,
                    "cache_hit": True,
                    "latency_ms": 5.2
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    feature_enabled: bool
    cache_enabled: bool
    cache_stats: Optional[Dict[str, Any]] = None
    cost_stats: Optional[Dict[str, Any]] = None
```

**要点**:
- 使用 `pydantic.BaseModel`
- `Field(...)` 表示必需字段，`Field(default=...)` 表示可选字段
- 包含详细的 `description`
- 使用 `Enum` 定义方法类型
- 提供 `model_config` 中的示例
- 响应模型必须包含: `method`, `cost`, `cache_hit`, `latency_ms`

### 1.4 FastAPI 应用 (app.py)

```python
"""
FastAPI Application for {Service} Service
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from src.config import settings
from src.models import (
    ServiceRequest,
    ServiceResponse,
    HealthResponse
)
from src.{service}_service import {service}_service
from src.cache import {service}_cache
from src.cost_tracker import cost_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    logger.info(f"Starting {settings.service_name} v{settings.service_version}")
    logger.info(f"Feature enabled: {settings.feature_enabled}")
    logger.info(f"Cache enabled: {settings.cache_enabled}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL {Service} Service",
    description="Description of the service",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "ok",
        "feature_enabled": settings.feature_enabled,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Returns service health status and statistics
    """
    try:
        health_data = await {service}_service.health_check()

        return HealthResponse(
            status="ok",
            service=settings.service_name,
            version=settings.service_version,
            feature_enabled=settings.feature_enabled,
            cache_enabled=settings.cache_enabled,
            cache_stats=health_data.get("cache_stats"),
            cost_stats=health_data.get("cost_stats")
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/process", response_model=ServiceResponse)
async def process_request(request: ServiceRequest):
    """
    Main processing endpoint

    Detailed description of what this endpoint does.

    Example:
        ```json
        {
            "input_field": "example",
            "context": {"key": "value"}
        }
        ```
    """
    try:
        response = await {service}_service.process(request)
        return response
    except Exception as e:
        logger.error(f"Processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process request: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics

    Returns:
    - Cache statistics (hit rate, size)
    - Cost tracking (daily spend, request counts)
    - Budget status
    """
    try:
        health_data = await {service}_service.health_check()

        return {
            "cache": health_data["cache_stats"],
            "cost": health_data["cost_stats"],
            "feature_enabled": settings.feature_enabled,
            "cache_enabled": settings.cache_enabled,
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear service cache

    Useful for testing or after updates
    """
    try:
        {service}_cache.clear()
        return {
            "status": "ok",
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level="info"
    )
```

**要点**:
- 使用 `@asynccontextmanager` 进行生命周期管理
- 配置结构化日志
- CORS 中间件
- 标准端点: `/`, `/health`, `/stats`, `/cache/clear`
- 主处理端点: 详细的文档字符串和示例
- 异常处理: 捕获异常并返回适当的 HTTP 状态码
- 可选的 `if __name__ == "__main__"` 用于本地运行

### 1.5 服务逻辑 ({service}_service.py)

```python
"""
Main {Service} Service
"""
import time
import logging
from typing import Optional
from .models import ServiceRequest, ServiceResponse, GenerationMethod
from .cache import {service}_cache
from .cost_tracker import cost_manager
from .config import settings

logger = logging.getLogger(__name__)


class {Service}Service:
    """
    Main {service} service

    Implements hybrid strategy:
    - Cache first
    - Primary provider (fast/cheap)
    - Fallback provider (quality/expensive)
    """

    def __init__(self):
        """Initialize service with providers"""
        self.primary_provider = None  # Initialize your primary provider
        self.fallback_provider = None  # Initialize fallback provider

    async def process(self, request: ServiceRequest) -> ServiceResponse:
        """
        Process service request

        Flow:
        1. Check cache for existing result
        2. Try primary provider (fast, cheap)
        3. If primary fails or quality insufficient, use fallback
        4. Cache result
        5. Track costs

        Args:
            request: Service request

        Returns:
            ServiceResponse with result
        """
        start_time = time.time()

        try:
            # 1. Check cache first
            cached = {service}_cache.get(request)
            if cached:
                result, cost = cached
                latency_ms = (time.time() - start_time) * 1000

                logger.info(f"Cache hit: {result[:30]}...")
                cost_manager.record_request(GenerationMethod.CACHED, cost, latency_ms)

                return ServiceResponse(
                    result=result,
                    method=GenerationMethod.CACHED,
                    cost=cost,
                    cache_hit=True,
                    latency_ms=latency_ms
                )

            # 2. Check budget
            can_process, reason = cost_manager.can_process()
            if not can_process:
                logger.warning(f"Budget exceeded: {reason}")
                raise Exception(f"Budget exceeded: {reason}")

            # 3. Process with primary provider
            response = await self._process_with_primary(request, start_time)

            # 4. Cache the response
            if settings.cache_enabled and not request.force_provider:
                {service}_cache.set(request, response.result, response.cost)

            # 5. Record cost
            cost_manager.record_request(response.method, response.cost, response.latency_ms)

            logger.info(
                f"Processed request: method={response.method.value}, "
                f"cost=${response.cost:.4f}, latency={response.latency_ms:.1f}ms"
            )

            return response

        except Exception as e:
            logger.error(f"Error processing request: {e}", exc_info=True)
            # Return error response or fallback
            return self._emergency_fallback(request, start_time)

    async def _process_with_primary(
        self,
        request: ServiceRequest,
        start_time: float
    ) -> ServiceResponse:
        """Process with primary provider"""
        try:
            # Call your primary provider
            result = await self.primary_provider.process(request)
            cost = 0.005  # Calculate actual cost

            total_latency_ms = (time.time() - start_time) * 1000

            return ServiceResponse(
                result=result,
                method=GenerationMethod.PROVIDER_A,
                cost=cost,
                cache_hit=False,
                latency_ms=total_latency_ms
            )

        except Exception as e:
            logger.error(f"Primary provider failed, using fallback: {e}")
            # Fallback to secondary provider
            return await self._process_with_fallback(request, start_time)

    async def _process_with_fallback(
        self,
        request: ServiceRequest,
        start_time: float
    ) -> ServiceResponse:
        """Process with fallback provider"""
        result = await self.fallback_provider.process(request)
        cost = 0.01  # Calculate actual cost
        total_latency_ms = (time.time() - start_time) * 1000

        return ServiceResponse(
            result=result,
            method=GenerationMethod.PROVIDER_B,
            cost=cost,
            cache_hit=False,
            latency_ms=total_latency_ms
        )

    def _emergency_fallback(
        self,
        request: ServiceRequest,
        start_time: float
    ) -> ServiceResponse:
        """Emergency fallback when everything fails"""
        result = "Fallback result"
        latency_ms = (time.time() - start_time) * 1000

        return ServiceResponse(
            result=result,
            method=GenerationMethod.PROVIDER_A,
            cost=0.0,
            cache_hit=False,
            latency_ms=latency_ms
        )

    async def health_check(self) -> dict:
        """Check service health"""
        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "feature_enabled": settings.feature_enabled,
            "cache_enabled": settings.cache_enabled,
            "cache_stats": {service}_cache.get_stats(),
            "cost_stats": cost_manager.get_budget_status(),
        }


# Global service instance
{service}_service = {Service}Service()
```

**要点**:
- 单例服务实例
- 混合策略: 缓存 → 主提供商 → 备用提供商
- 时间追踪 (`time.time()`)
- 成本检查和追踪
- 优雅的错误处理和降级
- 详细的日志记录
- Health check 返回完整状态

### 1.6 测试 (tests/test_api.py)

```python
"""
Tests for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app import app


class TestAPI:
    """Test API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "{service}-service"
        assert "version" in data
        assert data["status"] == "ok"

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "{service}-service"
        assert "feature_enabled" in data

    def test_process_basic_request(self, client):
        """Test basic processing"""
        request_data = {
            "input_field": "test input",
            "context": {}
        }

        response = client.post("/process", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        assert data["method"] in ["cached", "provider_a", "provider_b"]
        assert data["cost"] >= 0
        assert data["latency_ms"] > 0

    def test_stats_endpoint(self, client):
        """Test stats endpoint"""
        response = client.get("/stats")

        assert response.status_code == 200
        data = response.json()
        assert "cache" in data
        assert "cost" in data
        assert "feature_enabled" in data

    def test_cache_clear_endpoint(self, client):
        """Test cache clear endpoint"""
        response = client.post("/cache/clear")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_invalid_request(self, client):
        """Test invalid request handling"""
        # Missing required field
        request_data = {
            "context": {}
        }

        response = client.post("/process", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_caching_behavior(self, client):
        """Test that responses are cached"""
        request_data = {
            "input_field": "test",
            "context": {}
        }

        # First request
        response1 = client.post("/process", json=request_data)
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should hit cache
        response2 = client.post("/process", json=request_data)
        assert response2.status_code == 200
        data2 = response2.json()

        # Should return same result
        assert data1["result"] == data2["result"]
        # Second should be cached
        assert data2["method"] == "cached" or data2["cache_hit"] is True

    def test_performance(self, client):
        """Test that processing is fast"""
        request_data = {
            "input_field": "test",
            "context": {}
        }

        response = client.post("/process", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Should be reasonably fast
        assert data["latency_ms"] < 1000  # Under 1 second
```

**要点**:
- 使用 `TestClient` 进行 API 测试
- 测试所有端点
- 测试边缘情况和错误处理
- 测试性能要求
- 测试缓存行为
- 使用 fixtures 重用代码

### 1.7 依赖管理 (requirements.txt)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
redis==5.0.1
python-dotenv==1.0.0

# Provider SDKs
openai==1.12.0
anthropic==0.18.1

# Testing
pytest==7.4.3
pytest-asyncio==0.23.3
httpx==0.26.0
```

---

## 2. NestJS Service 模式

### 2.1 目录结构

```
src/
├── {module}/
│   ├── {module}.controller.ts    # HTTP 路由
│   ├── {module}.service.ts       # 业务逻辑
│   ├── {module}.module.ts        # 模块定义
│   ├── dto/                      # Data Transfer Objects
│   │   └── {name}.dto.ts
│   └── entities/                 # Prisma 实体类型
│       └── {name}.entity.ts
└── prisma/
    └── schema.prisma             # 数据库模型
```

### 2.2 Controller 模式

```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { {Module}Service } from './{module}.service';
import { Create{Entity}Dto, Update{Entity}Dto } from './dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('{module}')
@UseGuards(ApiKeyGuard)
export class {Module}Controller {
  constructor(private readonly {module}Service: {Module}Service) {}

  /**
   * GET /{module}
   * Get all entities
   */
  @Get()
  async findAll(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.{module}Service.findAll(limitNum);
  }

  /**
   * GET /{module}/:id
   * Get entity by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.{module}Service.findOne(id);
  }

  /**
   * POST /{module}
   * Create new entity
   */
  @Post()
  async create(@Body() createDto: Create{Entity}Dto) {
    return this.{module}Service.create(createDto);
  }
}
```

### 2.3 Service 模式

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create{Entity}Dto } from './dto';

@Injectable()
export class {Module}Service {
  private readonly logger = new Logger({Module}Service.name);

  constructor(private prisma: PrismaService) {}

  async findAll(limit: number = 100) {
    try {
      const entities = await this.prisma.{entity}.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return {
        entities,
        total: entities.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch entities: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    const entity = await this.prisma.{entity}.findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(`Entity ${id} not found`);
    }

    return entity;
  }

  async create(createDto: Create{Entity}Dto) {
    try {
      const entity = await this.prisma.{entity}.create({
        data: createDto,
      });

      this.logger.log(`Created entity: ${entity.id}`);
      return entity;
    } catch (error) {
      this.logger.error(`Failed to create entity: ${error.message}`);
      throw error;
    }
  }
}
```

---

## 3. 缓存模式

所有服务应使用 Redis 进行缓存，遵循以下模式:

```python
"""
Redis cache for {Service} Service
"""
import redis
import hashlib
import json
from typing import Optional, Tuple
from .config import settings

class {Service}Cache:
    """Redis-based cache"""

    def __init__(self):
        """Initialize Redis connection"""
        self.enabled = settings.cache_enabled
        if self.enabled:
            self.redis = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True
            )
        else:
            self.redis = None

        self.ttl = settings.cache_ttl
        self.hits = 0
        self.misses = 0

    def _generate_key(self, request) -> str:
        """Generate cache key from request"""
        # Create consistent hash from request parameters
        key_data = {
            "field1": request.field1,
            "field2": request.field2,
            # Include all relevant fields
        }
        key_str = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.sha256(key_str.encode()).hexdigest()[:16]
        return f"{settings.service_name}:{key_hash}"

    def get(self, request) -> Optional[Tuple[str, float]]:
        """Get cached result"""
        if not self.enabled or not self.redis:
            return None

        key = self._generate_key(request)
        try:
            cached = self.redis.get(key)
            if cached:
                self.hits += 1
                data = json.loads(cached)
                return data["result"], data["cost"]
            else:
                self.misses += 1
                return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, request, result: str, cost: float):
        """Cache result"""
        if not self.enabled or not self.redis:
            return

        key = self._generate_key(request)
        try:
            data = {
                "result": result,
                "cost": cost
            }
            self.redis.setex(key, self.ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache set error: {e}")

    def clear(self):
        """Clear all cache"""
        if self.redis:
            # Clear only this service's keys
            pattern = f"{settings.service_name}:*"
            for key in self.redis.scan_iter(match=pattern):
                self.redis.delete(key)
            self.hits = 0
            self.misses = 0

    def get_stats(self) -> dict:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "enabled": self.enabled
        }


# Global cache instance
{service}_cache = {Service}Cache()
```

---

## 4. 成本追踪模式

```python
"""
Cost tracking and budget management
"""
import redis
from datetime import datetime, timedelta
from typing import Tuple
from .config import settings
from .models import GenerationMethod

class CostManager:
    """Manage daily budget and track costs"""

    def __init__(self):
        """Initialize cost tracker"""
        self.redis = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True
        )
        self.daily_budget = settings.daily_budget
        self.max_cost_per_request = settings.max_cost_per_request

    def _get_daily_key(self) -> str:
        """Get Redis key for today's costs"""
        date_str = datetime.now().strftime("%Y-%m-%d")
        return f"{settings.service_name}:cost:{date_str}"

    def _get_stats_key(self) -> str:
        """Get Redis key for request stats"""
        date_str = datetime.now().strftime("%Y-%m-%d")
        return f"{settings.service_name}:stats:{date_str}"

    async def get_daily_cost(self) -> float:
        """Get today's total cost"""
        key = self._get_daily_key()
        cost = self.redis.get(key)
        return float(cost) if cost else 0.0

    def can_process(self) -> Tuple[bool, str]:
        """Check if we can process based on budget"""
        daily_cost = self.redis.get(self._get_daily_key())
        cost = float(daily_cost) if daily_cost else 0.0

        if cost >= self.daily_budget:
            return False, f"Daily budget ${self.daily_budget} exceeded (current: ${cost:.2f})"

        return True, "OK"

    def record_request(self, method: GenerationMethod, cost: float, latency_ms: float):
        """Record request cost and stats"""
        # Record cost
        daily_key = self._get_daily_key()
        self.redis.incrbyfloat(daily_key, cost)
        self.redis.expire(daily_key, 86400 * 2)  # Keep for 2 days

        # Record stats
        stats_key = self._get_stats_key()
        self.redis.hincrby(stats_key, f"{method.value}_count", 1)
        self.redis.hincrby(stats_key, f"{method.value}_latency", int(latency_ms))
        self.redis.expire(stats_key, 86400 * 2)

    def get_budget_status(self) -> dict:
        """Get current budget status"""
        daily_cost = self.redis.get(self._get_daily_key())
        cost = float(daily_cost) if daily_cost else 0.0

        stats_key = self._get_stats_key()
        stats = self.redis.hgetall(stats_key)

        # Calculate request counts
        cached_count = int(stats.get("cached_count", 0))
        primary_count = int(stats.get("provider_a_count", 0))
        fallback_count = int(stats.get("provider_b_count", 0))
        total_requests = cached_count + primary_count + fallback_count

        return {
            "daily_budget": self.daily_budget,
            "daily_cost": f"${cost:.4f}",
            "remaining": f"${max(0, self.daily_budget - cost):.4f}",
            "usage_percent": f"{(cost / self.daily_budget * 100):.1f}%",
            "total_requests": total_requests,
            "cached_requests": cached_count,
            "primary_requests": primary_count,
            "fallback_requests": fallback_count
        }


# Global cost manager instance
cost_manager = CostManager()
```

---

## 5. 端口分配规则

**现有服务端口**:
- `3000` - API Service (NestJS)
- `3001` - Realtime Gateway (Socket.IO)
- `3002` - Memory Service (Node.js)
- `8000` - Emotion Service (Python FastAPI)
- `8001` - Dialogue Service (Python FastAPI)

**新服务端口**:
- `8002` - Vision Service (Python FastAPI, 可选)
- `8003` - Voice Service (Python FastAPI, 必需)
- `5000` - Dashboard (Flask)

**规则**:
- Python FastAPI 服务: 8000-8999
- Node.js 服务: 3000-3999
- Flask 服务: 5000-5999

---

## 6. 环境变量规范

所有服务必须从 `../../.env` 或根目录的 `.env` 加载配置。

**必需变量**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agl_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# API Keys
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Service Ports
EMOTION_SERVICE_PORT=8000
DIALOGUE_SERVICE_PORT=8001
VOICE_SERVICE_PORT=8003
VISION_SERVICE_PORT=8002

# Feature Flags
ML_ENABLED=true
LLM_ENABLED=true
CACHE_ENABLED=true

# Cost Limits
EMOTION_DAILY_BUDGET=5.0
DIALOGUE_DAILY_BUDGET=10.0
VOICE_DAILY_BUDGET=50.0

# CORS
CORS_ORIGIN="*"
```

---

## 7. 文档规范

### 7.1 代码注释

**Python**:
- 使用 docstrings (""" """) 描述模块、类、函数
- 包含 Args, Returns, Raises 说明
- 关键逻辑添加行内注释

```python
def process(self, request: ServiceRequest) -> ServiceResponse:
    """
    Process service request

    Implements hybrid strategy:
    1. Check cache first
    2. Try primary provider
    3. Fallback to secondary if needed

    Args:
        request: Service request with input data

    Returns:
        ServiceResponse with result, method, cost, latency

    Raises:
        Exception: If all providers fail
    """
    # Implementation here
```

**TypeScript**:
- 使用 JSDoc (/** */) 描述方法
- 包含参数和返回值说明

```typescript
/**
 * Get analytics for a specific game
 *
 * @param gameId - Game ID
 * @param query - Query parameters (date range)
 * @returns Game analytics data
 */
async getGameAnalytics(gameId: string, query: GameAnalyticsQueryDto) {
  // Implementation
}
```

### 7.2 API 文档

- FastAPI 自动生成 `/docs` (Swagger UI)
- 提供详细的 description 和 examples
- 使用 Pydantic 模型的 `model_config` 添加示例

### 7.3 README

每个服务必须包含 `README.md`:

```markdown
# {Service} Service

## 概述
Brief description of what this service does.

## 功能特性
- Feature 1
- Feature 2

## 技术栈
- FastAPI 0.109.0
- Python 3.11+
- Redis (caching)
- Provider SDK

## 快速启动

### 开发环境
\`\`\`bash
# Install dependencies
pip install -r requirements.txt

# Start service
python app.py
\`\`\`

### Docker
\`\`\`bash
docker build -t agl-{service}-service .
docker run -p 8000:8000 agl-{service}-service
\`\`\`

## API 端点

### POST /process
Process request with hybrid strategy.

**Request**:
\`\`\`json
{
  "input_field": "example",
  "context": {}
}
\`\`\`

**Response**:
\`\`\`json
{
  "result": "output",
  "method": "cached",
  "cost": 0.0,
  "cache_hit": true,
  "latency_ms": 5.2
}
\`\`\`

## 测试

\`\`\`bash
pytest tests/ -v --cov=src
\`\`\`

## 配置

见 `src/config.py` 的完整配置选项。

## 架构

[Include architecture diagram or description]
```

---

## 8. 测试规范

### 8.1 覆盖率要求

- 单元测试覆盖率: **85%+**
- API 集成测试覆盖率: **100%** (所有端点)

### 8.2 测试类型

1. **单元测试**: 测试独立函数和类方法
2. **API 测试**: 测试所有 HTTP 端点
3. **集成测试**: 测试服务间交互
4. **性能测试**: 验证延迟和吞吐量要求

### 8.3 Fixtures

使用 `conftest.py` 定义共享 fixtures:

```python
@pytest.fixture
def sample_request():
    """Sample request for testing"""
    return ServiceRequest(
        input_field="test",
        context={"key": "value"}
    )

@pytest.fixture
def mock_provider():
    """Mock provider for testing"""
    mock = MagicMock()
    mock.process.return_value = "mocked result"
    return mock
```

---

## 9. Git 提交规范

遵循 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `test`: 测试添加/修改
- `refactor`: 代码重构
- `perf`: 性能优化
- `chore`: 构建/工具变更

**Examples**:
```
feat(voice): implement TTS synthesis with OpenAI API

- Add VoiceService with caching
- Implement cost tracking
- Add 15+ unit tests

Closes #123
```

---

## 10. Docker 部署模式

### 10.1 Dockerfile 模板

```dockerfile
# Python FastAPI Service
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 10.2 docker-compose.yml

新服务添加到 `docker-compose.yml`:

```yaml
services:
  {service}-service:
    build: ./services/{service}-service
    container_name: agl-{service}-service
    environment:
      - REDIS_URL=redis://redis:6379
      - {SERVICE}_PORT=8000
    ports:
      - "8000:8000"
    depends_on:
      - redis
    networks:
      - agl-network
```

---

## 总结

**核心原则**:
1. ✅ 严格遵循现有模式，不创新架构
2. ✅ 完整的文档和注释 (30%+ 注释率)
3. ✅ 高测试覆盖率 (85%+)
4. ✅ 成本追踪和预算控制
5. ✅ 优雅降级和错误处理
6. ✅ 结构化日志和监控指标

**参考服务**:
- Python FastAPI: `services/emotion-service/`, `services/dialogue-service/`
- NestJS: `services/api-service/`
- 缓存模式: 所有服务的 `cache.py`
- 成本追踪: 所有服务的 `cost_tracker.py`

在实现新功能时，始终参考现有服务的代码作为模板。
