# 3D Model Setup Guide for Avatar SDK

## 概述 (Overview)

本指南详细说明如何为 AGL Avatar SDK 准备和配置 3D 角色模型。

Avatar SDK 是**引擎级别**的 3D 渲染系统，不提供游戏特定的 3D 模型。开发者需要自行准备或获取符合规范的 3D 模型资源。

---

## 快速开始

### 方式 1: 使用占位符模型（原型开发）

Avatar SDK 内置几何占位符，无需任何 3D 资源即可快速开始：

```tsx
<AvatarController
  config={{
    customization: {
      modelSource: { type: 'placeholder' },
      primaryColor: '#4169e1'
    }
  }}
/>
```

### 方式 2: 使用免费资源（快速测试）

从以下平台获取免费 GLTF 模型：
- **Mixamo**: https://www.mixamo.com (免费，带动画)
- **Sketchfab**: https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount
- **Ready Player Me**: https://readyplayer.me (可定制头像)

### 方式 3: 定制模型（生产环境）

委托 3D 艺术家创建专属角色模型，或使用现有游戏资产。

---

## 模型要求规范

### 1. 文件格式

**支持**: GLTF (.gltf) 或 GLB (.glb)

**推荐**: GLB (二进制格式，加载更快)

**不支持**: FBX, OBJ, Collada (需要转换)

### 2. 模型规格

| 规格项 | 要求 | 推荐值 |
|--------|------|--------|
| **多边形数** | < 20,000 三角形 | 5,000 - 10,000 |
| **文件大小** | < 10MB | 3-5MB |
| **纹理分辨率** | 512x512 - 2048x2048 | 1024x1024 |
| **材质** | PBR 材质 | Metallic-Roughness |
| **骨骼数量** | < 100 | 30-50 |
| **模型高度** | ~2.0 单位 | 1.8 - 2.2 |
| **坐标系** | Y-up | Y-up |

### 3. 骨骼结构

**标准人形骨骼** (Humanoid Rig):

```
Root
├─ Hips
│  ├─ Spine
│  │  ├─ Spine1
│  │  │  ├─ Spine2
│  │  │  │  ├─ Neck
│  │  │  │  │  └─ Head
│  │  │  │  ├─ LeftShoulder
│  │  │  │  │  └─ LeftArm
│  │  │  │  │     └─ LeftForeArm
│  │  │  │  │        └─ LeftHand
│  │  │  │  └─ RightShoulder
│  │  │  │     └─ RightArm
│  │  │  │        └─ RightForeArm
│  │  │  │           └─ RightHand
│  ├─ LeftUpLeg
│  │  └─ LeftLeg
│  │     └─ LeftFoot
│  └─ RightUpLeg
│     └─ RightLeg
│        └─ RightFoot
```

**关键点**:
- 必须有根骨骼 (Root/Hips)
- 必须有脊柱、颈部、头部
- 必须有左右肩膀、手臂、手
- 可选：面部骨骼（用于表情）

### 4. 动画要求

每个角色需要 **37 个动画**:

#### 基础动画 (1个)
- `idle.gltf` - 待机动画

#### 情感动画 (36个)
12 种情感 × 3 种强度 = 36 个动画

| 情感 | Subtle (微妙) | Normal (正常) | Intense (强烈) |
|------|---------------|---------------|----------------|
| happy | happy_subtle.gltf | happy_normal.gltf | happy_intense.gltf |
| sad | sad_subtle.gltf | sad_normal.gltf | sad_intense.gltf |
| angry | angry_subtle.gltf | angry_normal.gltf | angry_intense.gltf |
| excited | excited_subtle.gltf | excited_normal.gltf | excited_intense.gltf |
| proud | proud_subtle.gltf | proud_normal.gltf | proud_intense.gltf |
| confident | confident_subtle.gltf | confident_normal.gltf | confident_intense.gltf |
| disappointed | disappointed_subtle.gltf | disappointed_normal.gltf | disappointed_intense.gltf |
| frustrated | frustrated_subtle.gltf | frustrated_normal.gltf | frustrated_intense.gltf |
| surprised | surprised_subtle.gltf | surprised_normal.gltf | surprised_intense.gltf |
| fearful | fearful_subtle.gltf | fearful_normal.gltf | fearful_intense.gltf |
| disgusted | disgusted_subtle.gltf | disgusted_normal.gltf | disgusted_intense.gltf |
| neutral | neutral_subtle.gltf | neutral_normal.gltf | neutral_intense.gltf |

**动画时长**: 1-3秒（循环动画）

### 5. 视觉资源

每个角色需要以下图片资源：

- **thumbnail.png** (256×256) - 角色缩略图
- **preview.png** (512×512) - 角色预览图

---

## 文件组织结构

### CDN 目录结构

```
cdn.example.com/agl/models/
├── cheerful/
│   ├── model.gltf                      # 主模型
│   ├── thumbnail.png                   # 缩略图
│   ├── preview.png                     # 预览图
│   ├── textures/                       # 纹理文件
│   │   ├── base_color.png
│   │   ├── normal.png
│   │   ├── metallic_roughness.png
│   │   └── emissive.png
│   └── animations/                     # 动画文件
│       ├── idle.gltf
│       ├── happy_subtle.gltf
│       ├── happy_normal.gltf
│       ├── happy_intense.gltf
│       ├── sad_subtle.gltf
│       ... (36 个情感动画)
│
├── cool/
│   ├── model.gltf
│   ├── thumbnail.png
│   ├── preview.png
│   ├── textures/
│   └── animations/
│       └── ... (37 个动画)
│
└── cute/
    ├── model.gltf
    ├── thumbnail.png
    ├── preview.png
    ├── textures/
    └── animations/
        └── ... (37 个动画)
```

---

## 获取 3D 模型的方式

### 方式 1: 使用免费资源

#### Mixamo (推荐用于快速原型)

**优点**:
- 完全免费
- 自动骨骼绑定
- 包含大量动画
- 支持 FBX 和 GLTF 导出

**步骤**:
1. 访问 https://www.mixamo.com
2. 选择角色模型（Characters）
3. 下载时选择格式：`GLTF Binary (.glb)`
4. 下载动画时选择相同格式
5. 使用 Blender 或 Three.js Editor 查看和调整

**适用场景**: 原型开发、演示、测试

#### Sketchfab

**优点**:
- 大量 CC0 (公共领域) 模型
- 高质量艺术作品
- 可直接下载 GLTF

**搜索建议**:
- 关键词: "character", "anime", "low poly", "stylized"
- 筛选: Features → Downloadable, License → CC BY or CC0

**下载格式**: GLTF

#### Ready Player Me

**优点**:
- 可定制的头像生成器
- 自动生成 GLTF
- 免费 API

**API**: https://docs.readyplayer.me

**适用场景**: 可定制角色系统

### 方式 2: 委托创作

#### 国内平台
- **站酷** (ZCOOL): https://www.zcool.com.cn
- **CGWell**: https://www.cgwell.com
- **猪八戒**: https://www.zbj.com

#### 国际平台
- **Fiverr**: https://www.fiverr.com (搜索 "3d character model")
- **Upwork**: https://www.upwork.com
- **ArtStation**: https://www.artstation.com/jobs

**成本估算**:
- 简单 Low-Poly 角色: $200-500
- 中等质量角色 + 动画: $500-1500
- 高质量全套角色: $1500-5000

**需求文档模板**:
```markdown
# 3D 角色模型需求

## 基本信息
- 角色人设: Cheerful Companion (活泼陪伴者)
- 性别: 女性
- 风格: 卡通/写实/日系

## 技术要求
- 格式: GLTF/GLB
- 多边形: 5000-10000 三角形
- 纹理: 1024×1024 PBR
- 骨骼: 标准人形骨骼

## 动画需求
- 1 个待机动画 (idle)
- 36 个情感动画 (见列表)
- 时长: 1-3 秒，可循环

## 交付物
- 角色模型 (model.gltf)
- 37 个动画文件
- 缩略图和预览图
- 源文件 (.blend / .fbx)

## 预算: $XXX
## 交付时间: X 周
```

### 方式 3: 使用现有游戏资产

如果你的游戏已有 3D 角色，可以直接导出为 GLTF：

#### 从 Unity 导出
1. 安装插件: UnityGLTF (https://github.com/KhronosGroup/UnityGLTF)
2. 选择角色模型
3. 导出为 GLTF

#### 从 Unreal 导出
1. 选择角色 Skeletal Mesh
2. File → Export → GLTF

#### 从 Blender 导出
1. File → Export → glTF 2.0
2. 选择格式: GLB (Binary) 或 GLTF (Embedded)
3. Include: Selected Objects, Apply Modifiers, Animation

---

## CDN 部署方案

### 方案 1: AWS S3 + CloudFront (推荐)

**成本**: ~$5-20/月 (取决于流量)

**步骤**:

1. **创建 S3 Bucket**:
```bash
aws s3 mb s3://agl-models-cdn
aws s3api put-bucket-cors --bucket agl-models-cdn --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}
```

2. **上传模型**:
```bash
aws s3 sync ./models/ s3://agl-models-cdn/models/ \
  --acl public-read \
  --cache-control "max-age=31536000"
```

3. **配置 CloudFront**:
- 创建 CloudFront Distribution
- Origin: S3 bucket
- 启用 GZIP 压缩
- 配置自定义域名（可选）

4. **更新环境变量**:
```bash
CDN_BASE_URL=https://d1234.cloudfront.net/models
```

### 方案 2: Cloudflare R2 (低成本)

**成本**: ~$0-5/月 (出站流量免费)

**步骤**:
1. 创建 Cloudflare R2 Bucket
2. 启用 Public Access
3. 配置 CORS
4. 上传文件

**优势**: 出站流量不收费

### 方案 3: GitHub Pages (免费，适合开发)

**步骤**:
1. 创建 GitHub 仓库: `agl-models`
2. 上传模型文件到 `models/` 目录
3. 启用 GitHub Pages
4. CDN URL: `https://username.github.io/agl-models/models`

**限制**:
- 单文件 < 100MB
- 仓库 < 1GB
- 不适合生产环境

### 方案 4: 自建 Nginx (完全控制)

**步骤**:
```bash
# 安装 Nginx
apt-get install nginx

# 配置站点
cat > /etc/nginx/sites-available/agl-cdn << 'EOF'
server {
    listen 80;
    server_name cdn.example.com;

    root /var/www/agl-models;

    # CORS
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";

    # 缓存
    location ~* \.(gltf|glb|png|jpg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # GZIP 压缩
    gzip on;
    gzip_types application/octet-stream image/png;
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/agl-cdn /etc/nginx/sites-enabled/
systemctl reload nginx

# 上传模型
rsync -avz ./models/ /var/www/agl-models/models/
```

---

## 性能优化

### 1. 模型优化

#### 减少多边形数
使用 Blender Decimate Modifier:
```
Blender → Select Model → Modifiers → Add Modifier → Decimate
Ratio: 0.5 (减少 50% 多边形)
Apply Modifier
```

#### 纹理压缩
```bash
# 使用 ImageMagick 压缩纹理
convert texture.png -resize 1024x1024 -quality 85 texture_optimized.png
```

#### Draco 压缩 (推荐)
```bash
# 安装 gltf-pipeline
npm install -g gltf-pipeline

# 压缩 GLTF
gltf-pipeline -i model.gltf -o model_compressed.glb -d
```

**压缩效果**: 可减少 70-90% 文件大小

### 2. LOD (Level of Detail)

为角色创建多个 LOD 级别：

```
cheerful/
├── model_lod0.gltf  (高细节, 10000 三角形)
├── model_lod1.gltf  (中细节, 5000 三角形)
└── model_lod2.gltf  (低细节, 2000 三角形)
```

Avatar SDK 会根据距离自动切换 LOD。

### 3. 懒加载

只加载当前需要的动画：

```tsx
// 延迟加载非关键动画
const loadAnimation = async (emotion: string, intensity: string) => {
  const url = `${CDN_BASE_URL}/cheerful/animations/${emotion}_${intensity}.gltf`;
  return await loader.loadAsync(url);
};
```

---

## 测试和验证

### 工具推荐

#### 1. Online GLTF Viewer
https://gltf-viewer.donmccurdy.com

**用途**: 快速预览 GLTF 文件，检查模型和动画

#### 2. Three.js Editor
https://threejs.org/editor/

**用途**: 在线编辑 GLTF，调整材质和灯光

#### 3. Blender
https://www.blender.org

**用途**: 专业 3D 编辑软件，查看骨骼结构，修改模型

### 验证清单

- [ ] 模型能在 GLTF Viewer 中正常显示
- [ ] 多边形数 < 20,000
- [ ] 文件大小 < 10MB
- [ ] 骨骼结构符合标准人形骨骼
- [ ] 所有 37 个动画文件都存在
- [ ] 动画在 Viewer 中播放流畅
- [ ] 纹理正确显示
- [ ] CORS 头配置正确（可在浏览器中加载）

---

## 故障排查

### 问题1: 模型加载失败

**症状**: Avatar 显示空白或错误

**可能原因**:
- URL 错误
- CORS 未配置
- 文件损坏

**解决**:
```bash
# 检查文件是否可访问
curl -I https://cdn.example.com/agl/models/cheerful/model.gltf

# 检查 CORS 头
curl -H "Origin: http://localhost:3000" \
  -I https://cdn.example.com/agl/models/cheerful/model.gltf

# 应该看到:
# Access-Control-Allow-Origin: *
```

### 问题2: 动画不播放

**可能原因**:
- 动画文件命名错误
- 骨骼名称不匹配
- 动画 clip 为空

**解决**:
1. 使用 Three.js Editor 检查动画
2. 确认动画命名符合规范
3. 检查骨骼结构

### 问题3: 性能差

**可能原因**:
- 多边形数过高
- 纹理分辨率过大
- 未启用压缩

**解决**:
1. 使用 Decimate Modifier 减少多边形
2. 压缩纹理到 1024×1024
3. 使用 Draco 压缩
4. 启用 LOD

---

## 快速开始模板

### 开发环境（无 CDN）

使用本地占位符快速开始：

```tsx
// 无需配置 CDN，直接使用内置占位符
<AvatarController
  config={{
    customization: {
      modelSource: { type: 'placeholder' },
      primaryColor: '#4169e1'
    },
    initialEmotion: 'happy'
  }}
/>
```

### 生产环境（完整配置）

```tsx
// 1. 从 Character API 获取模型配置
const response = await fetch('http://localhost:3000/characters');
const { characters } = await response.json();
const character = characters[0]; // Cheerful Companion

// 2. 使用 API 返回的 modelConfig
<AvatarController
  config={{
    customization: {
      modelSource: {
        type: 'gltf',
        url: character.modelConfig.modelUrl,
        scale: character.modelConfig.scale
      }
    },
    initialEmotion: 'happy',
    enableAnimations: true
  }}
/>
```

---

## 参考资源

### 文档
- GLTF 规范: https://www.khronos.org/gltf/
- Three.js GLTF Loader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Avatar SDK 文档: `sdk/avatar/README.md`

### 工具
- Blender: https://www.blender.org (免费 3D 软件)
- gltf-pipeline: https://github.com/CesiumGS/gltf-pipeline (GLTF 优化)
- gltf-transform: https://gltf-transform.donmccurdy.com (在线优化)

### 社区
- Three.js Discourse: https://discourse.threejs.org
- Khronos GLTF Forums: https://community.khronos.org

---

## 总结

### 快速决策表

| 场景 | 推荐方案 | 成本 | 时间 |
|------|----------|------|------|
| 原型开发 | 内置占位符 | $0 | 立即 |
| 快速测试 | Mixamo 免费资源 | $0 | 1-2 小时 |
| 中期开发 | Sketchfab CC0 模型 | $0 | 1-2 天 |
| 生产环境 | 委托定制 + AWS CDN | $500-2000 | 2-4 周 |

### 关键要点

1. ✅ Avatar SDK 不提供 3D 模型，需自行准备
2. ✅ 支持占位符快速原型开发
3. ✅ GLTF 是唯一支持的格式
4. ✅ 每个角色需要 37 个动画（1 idle + 36 情感）
5. ✅ 使用 CDN 部署模型资源
6. ✅ Character API 返回所有模型 URLs

---

**需要帮助？** 联系开发团队或查阅 Avatar SDK 文档。
