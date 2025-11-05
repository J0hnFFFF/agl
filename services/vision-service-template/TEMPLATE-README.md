# Vision Service Template

⚠️ **这是一个架构模板，不是实际运行的服务**

## 目的

本模板展示如何实现一个可选的后端代理服务，用于：
- API 密钥安全（隐藏在后端）
- 智能缓存（降低成本）
- 成本控制（每日预算）
- 统一管理（日志、监控）

## 何时使用代理服务

### 直接调用 Vision API (Vision SDK)
✅ **适用场景**:
- 开发和测试环境
- 原型和演示
- 个人项目
- API 密钥可以安全管理（如 Unity 构建配置）

### 使用代理服务
✅ **强烈推荐**:
- 生产环境部署
- 多用户应用
- 需要成本控制
- 需要 API 密钥安全

## 如何实现

参考现有服务的实现模式：

1. **复制文件结构**（参考 emotion-service 或 dialogue-service）
2. **实现核心功能**:
   ```python
   # src/vision_service.py
   class VisionService:
       async def analyze(self, request):
           # 1. 检查缓存
           cached = cache.get(request)
           if cached:
               return cached

           # 2. 检查预算
           can_use, reason = cost_manager.can_use_vision()
           if not can_use:
               raise Exception(reason)

           # 3. 调用 GPT-4V 或 Claude Vision
           result = await self.vision_provider.analyze(request)

           # 4. 缓存结果
           cache.set(request, result, ttl=86400)  # 24 hours

           # 5. 追踪成本
           cost_manager.record_request('vision', result.cost, result.latency)

           return result
   ```

3. **集成 Vision API**:
   - OpenAI GPT-4V: `openai.chat.completions.create()` with vision
   - Anthropic Claude Vision: `anthropic.messages.create()` with images

4. **实现缓存和成本追踪**（参考 `docs/IMPLEMENTATION-PATTERNS.md`）

## 当前状态

- ✅ 完整的 API 端点定义
- ✅ 完整的数据模型（Pydantic）
- ✅ 配置管理
- ❌ **核心业务逻辑未实现**（`vision_service.py` 需要创建）
- ❌ 测试覆盖率 0%

## 估算工作量

- **实现时间**: 2-3 天
- **测试时间**: 1 天
- **文档时间**: 0.5 天
- **总计**: 3.5-4.5 天

## 参考资料

- [IMPLEMENTATION-PATTERNS.md](../../docs/IMPLEMENTATION-PATTERNS.md) - 完整实现模式
- [emotion-service](../emotion-service/) - 参考实现
- [dialogue-service](../dialogue-service/) - 参考实现

---

**如果不需要代理服务，可以直接使用 Vision SDK 调用 API**
