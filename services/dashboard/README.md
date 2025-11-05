# AGL Analytics Dashboard

**Flask-based web dashboard for visualizing AGL platform analytics data**

## 概述

AGL Analytics Dashboard 是一个基于 Flask 的 Web 可视化仪表板，用于展示 AGL 游戏陪伴引擎的运营数据和分析指标。

### 核心特性

✅ **实时监控** - 每小时请求量、延迟、活跃用户实时追踪
✅ **成本分析** - LLM API 成本统计、按服务分解、每日趋势
✅ **平台概览** - 总体运营数据、方法使用分布、性能指标
✅ **游戏详情** - 单个游戏的详细分析和情感分布
✅ **图表可视化** - Chart.js 驱动的交互式图表
✅ **响应式设计** - Tailwind CSS，支持移动端和桌面端

### 架构设计

```
Dashboard Service (Flask)
    ↓ HTTP
Analytics API (NestJS)
    ↓ Database Query
PostgreSQL (Daily/Hourly Analytics)
```

**重要原则**:
- Dashboard **只调用** Analytics API，**不直接访问数据库**
- 只读操作，不修改任何数据
- 轻量级展示层，业务逻辑在 Analytics API 中

---

## 快速开始

### 前置条件

- Python 3.11+
- pip
- AGL API Service 运行中（提供 Analytics API）

### 安装依赖

```bash
cd services/dashboard
pip install -r requirements.txt
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Flask Settings
DASHBOARD_SECRET_KEY=your-secret-key-change-in-production
DASHBOARD_HOST=0.0.0.0
DASHBOARD_PORT=5000

# API Service Connection
API_SERVICE_URL=http://localhost:3000
DASHBOARD_API_KEY=your-api-key-here  # 需要有 Analytics API 访问权限的 API Key
```

### 启动服务

```bash
# 开发模式（带自动重载）
python app.py

# 生产模式
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Dashboard 运行在 `http://localhost:5000`

---

## 功能页面

### 1. 平台概览 (`/`)

展示整体运营数据：

**关键指标卡片**:
- 活跃游戏数
- 总玩家数
- 总事件数
- 总成本

**服务请求统计**:
- 情感识别请求数
- 对话生成请求数
- 记忆创建/搜索数

**方法使用分布**:
- 规则引擎 vs ML 分类器（情感）
- 模板库 vs LLM 生成（对话）
- 缓存命中率

**API 调用**: `GET /api/v1/analytics/platform?days=30`

### 2. 成本分析 (`/costs`)

详细的成本统计和趋势：

**成本概览**:
- 总成本（USD）
- 总请求数
- 平均单次请求成本

**按服务分解**:
- 情感识别成本
- 对话生成成本
- 记忆服务成本

**每日成本趋势图表**:
- 折线图展示每日各服务成本变化
- 支持 7/30/90 天时间范围
- 可按服务类型筛选

**API 调用**:
- `GET /api/v1/analytics/costs?startDate=...&endDate=...`

### 3. 实时监控 (`/realtime`)

每小时数据实时监控：

**当前小时指标**:
- 本小时事件数
- 活跃玩家数
- 平均延迟
- 本小时成本

**每小时事件量图表**:
- 柱状图展示最近 24 小时事件量

**服务请求分布**:
- 情感识别 vs 对话生成请求趋势

**服务延迟趋势**:
- 各服务平均延迟变化

**自动刷新**:
- 默认每 30 秒自动刷新
- 可手动刷新

**API 调用**:
- `GET /api/v1/analytics/hourly?hours=24`

### 4. 游戏详情 (`/game/:gameId`)

单个游戏的详细分析：

**使用统计**:
- 总事件数
- 总玩家数
- 平均延迟
- 总成本

**情感分布**:
- 柱状图展示各情感类型计数

**每日统计趋势**:
- 事件数和玩家数双轴折线图

**服务分解**:
- 情感识别、对话生成、记忆服务请求数

**API 调用**:
- `GET /api/v1/analytics/games/:gameId/usage?days=30`
- `GET /api/v1/analytics/games/:gameId/emotions`

---

## API 集成

### API Client 架构

Dashboard 使用 `AnalyticsAPIClient` 类封装所有 Analytics API 调用：

```python
from src.api_client import AnalyticsAPIClient

# 初始化客户端
client = AnalyticsAPIClient(
    base_url="http://localhost:3000/api/v1/analytics",
    api_key="your-api-key"
)

# 获取平台统计
stats = client.get_platform_stats(days=30)

# 获取成本分析
costs = client.get_cost_analytics(
    start_date="2024-01-01",
    end_date="2024-01-31"
)

# 获取实时数据
hourly = client.get_hourly_analytics(hours=24)
```

### 错误处理

所有 API 调用都包含错误处理：

```python
try:
    stats = api_client.get_platform_stats(days=30)
except AnalyticsAPIError as e:
    logger.error(f"API error: {e}")
    # 显示友好的错误消息给用户
```

Dashboard 在 API 失败时会：
1. 记录详细错误日志
2. 显示友好的错误消息
3. 不会崩溃或返回 500 错误

---

## 开发指南

### 项目结构

```
dashboard/
├── app.py                   # Flask 应用主文件
├── src/
│   ├── __init__.py
│   ├── config.py            # 配置管理
│   └── api_client.py        # Analytics API 客户端
├── templates/               # Jinja2 模板
│   ├── base.html            # 基础模板
│   ├── index.html           # 平台概览
│   ├── costs.html           # 成本分析
│   ├── realtime.html        # 实时监控
│   ├── game_detail.html     # 游戏详情
│   ├── 404.html             # 404 错误页
│   └── 500.html             # 500 错误页
├── static/                  # 静态资源（未使用，使用 CDN）
├── tests/                   # 测试文件
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── test_api_client.py   # API 客户端测试
│   └── test_app.py          # Flask 应用测试
├── requirements.txt         # Python 依赖
├── .env.example             # 环境变量示例
└── README.md                # 本文档
```

### 添加新页面

1. **创建路由** (`app.py`):

```python
@app.route('/new-page')
def new_page():
    try:
        # 调用 API 获取数据
        data = api_client.get_some_data()

        return render_template('new_page.html', data=data, error=None)
    except AnalyticsAPIError as e:
        return render_template('new_page.html', data=None, error=str(e))
```

2. **创建模板** (`templates/new_page.html`):

```html
{% extends "base.html" %}

{% block title %}新页面 - AGL Dashboard{% endblock %}

{% block content %}
<div class="px-4 sm:px-0">
    <h1 class="text-3xl font-bold text-gray-900">新页面</h1>

    {% if data %}
    <!-- 显示数据 -->
    {% else %}
    <!-- 无数据状态 -->
    {% endif %}
</div>
{% endblock %}
```

3. **添加导航链接** (`templates/base.html`):

```html
<a href="/new-page" class="...">
    新页面
</a>
```

### 测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_api_client.py

# 带覆盖率报告
pytest --cov=src --cov=app

# 详细输出
pytest -v
```

测试覆盖目标: **85%+**

---

## 部署

### Docker

创建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 5000

# 使用 Gunicorn 运行
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

构建和运行:

```bash
docker build -t agl-dashboard .
docker run -d -p 5000:5000 \
  -e API_SERVICE_URL=http://api-service:3000 \
  -e DASHBOARD_API_KEY=your-api-key \
  agl-dashboard
```

### Docker Compose

添加到 `docker-compose.yml`:

```yaml
services:
  dashboard:
    build: ./services/dashboard
    container_name: agl-dashboard
    environment:
      - NODE_ENV=production
      - API_SERVICE_URL=http://api-service:3000
      - DASHBOARD_API_KEY=${DASHBOARD_API_KEY}
      - DASHBOARD_SECRET_KEY=${DASHBOARD_SECRET_KEY}
    ports:
      - "5000:5000"
    depends_on:
      - api-service
    networks:
      - agl-network
    restart: unless-stopped
```

### 生产部署建议

1. **使用 Gunicorn + Nginx**:

```nginx
# /etc/nginx/sites-available/dashboard
server {
    listen 80;
    server_name dashboard.agl.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

2. **使用 Supervisor 管理进程**:

```ini
# /etc/supervisor/conf.d/dashboard.conf
[program:agl-dashboard]
command=/path/to/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
directory=/path/to/services/dashboard
user=agl
autostart=true
autorestart=true
stderr_logfile=/var/log/agl/dashboard.err.log
stdout_logfile=/var/log/agl/dashboard.out.log
```

3. **配置 HTTPS**:

使用 Let's Encrypt:

```bash
certbot --nginx -d dashboard.agl.example.com
```

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 后端语言 |
| Flask | 3.0.0 | Web 框架 |
| Requests | 2.31.0 | HTTP 客户端 |
| Jinja2 | 3.1.2 | 模板引擎 |
| Tailwind CSS | 3.x (CDN) | UI 框架 |
| Chart.js | 4.4.0 (CDN) | 数据可视化 |
| pytest | 7.4.3 | 测试框架 |

### 为什么选择 Flask？

1. **轻量级** - Dashboard 只是展示层，不需要复杂框架
2. **快速开发** - Flask 简单直观，适合 Web 界面
3. **与 Python 服务生态一致** - Emotion/Dialogue/Voice 服务都是 Python
4. **易于部署** - 支持 Gunicorn, uWSGI 等生产级部署

### 为什么不用 React/Vue？

- Dashboard 是**内部工具**，不需要复杂的前端交互
- 服务端渲染（SSR）更快，SEO 友好（虽然不重要）
- 减少前端构建复杂度（no webpack, npm build）
- Jinja2 + Tailwind + Chart.js 足够实现所有需求

---

## 性能优化

### 1. API 响应缓存

Dashboard 可以添加简单的内存缓存：

```python
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=128)
def cached_platform_stats(days: int, cache_key: str):
    """Cached version of platform stats (cache_key for TTL)"""
    return api_client.get_platform_stats(days)

# 使用时传入时间戳作为 cache_key，每分钟刷新
cache_key = datetime.now().strftime("%Y%m%d%H%M")
stats = cached_platform_stats(30, cache_key)
```

### 2. 异步数据加载

实时监控页面使用 AJAX 自动刷新：

```javascript
// 每 30 秒刷新数据
setInterval(async () => {
    const response = await fetch('/api/hourly-data?hours=24');
    const data = await response.json();
    updateCharts(data);
}, 30000);
```

### 3. Chart.js 优化

对于大数据集，限制显示数据点：

```javascript
// 只显示最近 24 小时，每小时一个数据点
const recentData = hourlyData.slice(-24);
```

---

## 故障排查

### 问题 1: Dashboard 无法连接到 API Service

**症状**: 页面显示 "API request failed: Network error"

**解决**:
1. 检查 API Service 是否运行: `curl http://localhost:3000/health`
2. 检查 `API_SERVICE_URL` 配置是否正确
3. 检查网络连接（防火墙、Docker 网络）

### 问题 2: API 返回 401 Unauthorized

**症状**: 所有页面显示 "API request failed: 401"

**解决**:
1. 检查 `DASHBOARD_API_KEY` 是否正确配置
2. 验证 API Key 有 Analytics API 访问权限
3. 使用 curl 测试 API Key:
   ```bash
   curl -H "X-API-Key: your-key" http://localhost:3000/api/v1/analytics/platform
   ```

### 问题 3: 图表不显示

**症状**: 页面加载，但图表区域空白

**解决**:
1. 检查浏览器控制台是否有 JavaScript 错误
2. 确认 Chart.js CDN 可访问（网络问题）
3. 检查数据格式是否正确（查看浏览器 Network 标签）

### 问题 4: 页面加载缓慢

**症状**: Dashboard 响应时间 > 5 秒

**解决**:
1. 检查 Analytics API 性能（直接调用 API 测试）
2. 减少时间范围（如从 90 天改为 30 天）
3. 优化数据库查询（Analytics API 层）
4. 添加 Dashboard 缓存（见性能优化章节）

---

## 安全考虑

### 1. API Key 安全

- ✅ API Key 存储在环境变量，不提交到代码库
- ✅ Dashboard 是内部工具，使用 API Key 认证（不是用户认证）
- ⚠️ 生产环境应配置防火墙，只允许内部网络访问

### 2. CORS 配置

Dashboard 启用了 CORS，允许从任何源访问（开发方便）：

```python
CORS(app)  # 允许所有来源
```

生产环境建议限制：

```python
CORS(app, origins=["https://dashboard.agl.example.com"])
```

### 3. 输入验证

所有用户输入（查询参数）都经过验证：

```python
days = request.args.get('days', 30, type=int)
# type=int 自动验证并转换，无效输入返回默认值 30
```

### 4. SQL 注入防护

Dashboard **不直接访问数据库**，所有查询通过 Analytics API，由 Prisma ORM 自动防护 SQL 注入。

---

## 监控和日志

### 日志级别

```python
# 开发环境
LOG_LEVEL=DEBUG

# 生产环境
LOG_LEVEL=INFO
```

### 关键日志

Dashboard 记录以下事件：

```
INFO - Making GET request to http://localhost:3000/api/v1/analytics/platform
ERROR - Error fetching platform stats: API request failed: 500
```

### 查看日志

```bash
# 开发模式（控制台输出）
python app.py

# 生产模式（重定向到文件）
gunicorn app:app 2>&1 | tee dashboard.log
```

---

## FAQ

### Q: Dashboard 可以部署在公网吗？

**A**: 可以，但建议：
1. 配置防火墙，只允许公司 IP 访问
2. 添加 HTTP Basic Auth 或 OAuth2 认证
3. 使用 HTTPS（必需）

### Q: 如何添加用户认证？

**A**: Dashboard 是内部工具，当前只使用 API Key。如需用户认证，可以：
1. 使用 Flask-Login + 用户数据库
2. 集成 OAuth2（Google, GitHub）
3. 使用 Nginx Basic Auth（最简单）

### Q: 能否直接访问数据库获取数据？

**A**: **不推荐**。应该：
- ✅ 保持当前架构：Dashboard → Analytics API → Database
- ✅ 在 Analytics API 中添加新端点（如果需要新数据）
- ❌ 不要让 Dashboard 直接查询 PostgreSQL

原因：
- 业务逻辑应该集中在 API 层
- 数据库结构可能变化，API 提供稳定接口
- API 层有缓存、权限控制等

### Q: 如何添加新的图表类型？

**A**: Chart.js 支持多种图表：

```javascript
// 饼图
new Chart(ctx, { type: 'pie', ... });

// 雷达图
new Chart(ctx, { type: 'radar', ... });

// 散点图
new Chart(ctx, { type: 'scatter', ... });
```

参考：https://www.chartjs.org/docs/latest/charts/

---

## 相关文档

- [Analytics API Documentation](../api-service/README.md) - Analytics API 完整文档
- [Database Schema](../../docs/database-schema.md) - 数据库结构
- [Deployment Guide](../../docs/DEPLOYMENT.md) - 部署指南

---

## 贡献指南

### 代码规范

- **Python**: 遵循 PEP 8，使用 black 格式化
- **注释**: 30%+ 注释率，关键逻辑必须注释
- **测试**: 新功能必须有测试，覆盖率 ≥ 85%

### 提交 PR

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-chart`
3. 提交代码: `git commit -m "feat: add new chart type"`
4. 推送分支: `git push origin feature/new-chart`
5. 创建 Pull Request

---

**Dashboard for Analytics - 轻量级、高效、易维护**
