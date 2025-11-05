# Avatar SDK Integration Guide

## 与 AGL Character API 集成

本指南说明如何将 Avatar SDK 与 AGL API Service 的 Character API 集成，实现完整的 3D 角色渲染。

---

## 概述

**集成流程**:
1. 从 Character API 获取角色数据（包含 3D 模型 URLs）
2. 使用 Avatar SDK 加载和渲染 3D 模型
3. 监听 Emotion Service 事件，更新角色情感
4. 同步 Dialogue Service 对话，显示语音气泡

---

## 前置要求

### 环境配置

确保 `.env` 文件中配置了 CDN URL:

```bash
# AGL API Service
API_SERVICE_URL=http://localhost:3000

# CDN (3D 模型资源)
CDN_BASE_URL=https://cdn.example.com/agl/models
```

### 安装依赖

```bash
npm install @agl/avatar @agl/web
```

---

## 基础集成

### 1. 获取角色配置

```tsx
import { useState, useEffect } from 'react';
import { AvatarController } from '@agl/avatar';

function CompanionAvatar() {
  const [characterConfig, setCharacterConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 Character API 获取角色配置
    fetch('http://localhost:3000/characters')
      .then(res => res.json())
      .then(data => {
        // 选择 Cheerful 角色
        const cheerful = data.characters.find(c => c.persona === 'cheerful');
        setCharacterConfig(cheerful);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load character:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading character...</div>;
  }

  if (!characterConfig) {
    return <div>Failed to load character</div>;
  }

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: characterConfig.modelConfig.modelUrl,
            scale: characterConfig.modelConfig.scale
          }
        },
        initialEmotion: 'neutral',
        position: characterConfig.modelConfig.position,
        enableAnimations: true
      }}
      showEmotionWheel={true}
      width={400}
      height={600}
    />
  );
}
```

---

## 完整集成示例

### 与 Emotion + Dialogue + Voice Service 集成

```tsx
import { useState, useEffect } from 'react';
import { AvatarController } from '@agl/avatar';
import { useAGLClient } from '@agl/web';

function GameCompanion() {
  // 角色配置
  const [character, setCharacter] = useState(null);

  // 当前状态
  const [emotion, setEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState(0.5);
  const [dialogue, setDialogue] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  // AGL Client (WebSocket 连接)
  const { sendEvent, onCompanionAction } = useAGLClient({
    apiUrl: 'http://localhost:3000',
    gameId: 'your-game-id'
  });

  // 加载角色配置
  useEffect(() => {
    loadCharacter('cheerful');
  }, []);

  // 监听陪伴角色事件
  useEffect(() => {
    return onCompanionAction((action) => {
      // 更新情感
      setEmotion(action.emotion);
      setIntensity(action.intensity);

      // 更新对话
      setDialogue(action.dialogue);

      // 合成语音（可选）
      if (action.dialogue) {
        synthesizeVoice(action.dialogue, character.persona);
      }
    });
  }, [character]);

  // 加载角色
  const loadCharacter = async (persona: string) => {
    const response = await fetch('http://localhost:3000/characters');
    const data = await response.json();
    const selectedCharacter = data.characters.find(c => c.persona === persona);
    setCharacter(selectedCharacter);
  };

  // 语音合成
  const synthesizeVoice = async (text: string, persona: string) => {
    const response = await fetch('http://localhost:8003/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        persona,
        language: 'zh-CN',
        format: 'mp3'
      })
    });

    const result = await response.json();
    setAudioUrl(result.audio_url);

    // 播放音频
    const audio = new Audio(result.audio_url);
    audio.play();
  };

  // 发送游戏事件
  const handleGameEvent = (eventType: string, data: any) => {
    sendEvent(eventType, data);
  };

  if (!character) {
    return <div>Loading companion...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 3D 角色渲染 */}
      <AvatarController
        config={{
          customization: {
            modelSource: {
              type: 'gltf',
              url: character.modelConfig.modelUrl,
              scale: character.modelConfig.scale
            }
          },
          initialEmotion: emotion,
          position: character.modelConfig.position,
          enableAnimations: true,
          enableInteractions: true
        }}
        rendererOptions={character.modelConfig.avatarSettings}
        showEmotionWheel={true}
        emotionWheelPosition="top-right"
        bubbleConfig={{
          enabled: true,
          position: 'top',
          maxWidth: 350,
          autoHideDelay: 5000
        }}
        dialogueText={dialogue}
        handlers={{
          onEmotionChange: (newEmotion, newIntensity) => {
            // 用户手动改变情感时
            setEmotion(newEmotion);
            setIntensity(newIntensity);

            // 可选：发送事件到服务端
            sendEvent('companion.emotion_changed', {
              emotion: newEmotion,
              intensity: newIntensity
            });
          },
          onModelLoad: (model) => {
            console.log('Character model loaded:', model);
          },
          onModelError: (error) => {
            console.error('Failed to load model:', error);
          }
        }}
        width={500}
        height={700}
      />

      {/* 游戏事件触发按钮（示例） */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button onClick={() => handleGameEvent('player.victory', { mvp: true })}>
          Victory 🏆
        </button>
        <button onClick={() => handleGameEvent('player.defeat', {})}>
          Defeat 😔
        </button>
        <button onClick={() => handleGameEvent('player.achievement', { rarity: 'legendary' })}>
          Achievement ⭐
        </button>
      </div>

      {/* 角色信息 */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <h3>{character.name}</h3>
        <p>{character.description}</p>
        <p>Current Emotion: <strong>{emotion}</strong> ({(intensity * 100).toFixed(0)}%)</p>
      </div>
    </div>
  );
}

export default GameCompanion;
```

---

## 自定义角色选择器

```tsx
import { useState, useEffect } from 'react';
import { AvatarController } from '@agl/avatar';

function CharacterSelector() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    // 加载所有可用角色
    fetch('http://localhost:3000/characters')
      .then(res => res.json())
      .then(data => {
        setCharacters(data.characters);
        setSelectedCharacter(data.characters[0]); // 默认选择第一个
      });
  }, []);

  return (
    <div>
      {/* 角色选择器 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {characters.map(character => (
          <div
            key={character.id}
            onClick={() => setSelectedCharacter(character)}
            style={{
              cursor: 'pointer',
              border: selectedCharacter?.id === character.id ? '3px solid #4169e1' : '1px solid #ccc',
              borderRadius: 8,
              padding: 10,
              textAlign: 'center'
            }}
          >
            {/* 缩略图 */}
            <img
              src={character.modelConfig.thumbnailUrl}
              alt={character.name}
              style={{ width: 100, height: 100, borderRadius: 8 }}
            />
            <p><strong>{character.name}</strong></p>
            <p style={{ fontSize: 12, color: '#666' }}>{character.persona}</p>
          </div>
        ))}
      </div>

      {/* 角色 3D 预览 */}
      {selectedCharacter && (
        <AvatarController
          config={{
            customization: {
              modelSource: {
                type: 'gltf',
                url: selectedCharacter.modelConfig.modelUrl,
                scale: selectedCharacter.modelConfig.scale
              }
            },
            initialEmotion: 'happy',
            enableAnimations: true
          }}
          rendererOptions={{
            ...selectedCharacter.modelConfig.avatarSettings,
            autoRotate: true // 自动旋转预览
          }}
          showEmotionWheel={true}
          width={600}
          height={800}
        />
      )}
    </div>
  );
}
```

---

## 预加载优化

### 预加载角色模型

```tsx
import { preloadModel } from '@agl/avatar';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // 在应用启动时预加载所有角色模型
    const preloadCharacters = async () => {
      const response = await fetch('http://localhost:3000/characters');
      const data = await response.json();

      // 并行预加载所有模型
      const preloadPromises = data.characters.map(character =>
        preloadModel(character.modelConfig.modelUrl)
      );

      await Promise.all(preloadPromises);
      console.log('All character models preloaded');
    };

    preloadCharacters();
  }, []);

  return <GameCompanion />;
}
```

### 懒加载动画

```tsx
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 动画加载器
const animationCache = new Map();

async function loadAnimation(characterPersona: string, emotion: string, intensity: string) {
  const key = `${characterPersona}_${emotion}_${intensity}`;

  // 检查缓存
  if (animationCache.has(key)) {
    return animationCache.get(key);
  }

  // 从 Character API 获取动画 URL
  const response = await fetch('http://localhost:3000/characters');
  const data = await response.json();
  const character = data.characters.find(c => c.persona === characterPersona);

  const animationUrl = character.modelConfig.animations[`${emotion}_${intensity}`];

  // 加载动画
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(animationUrl);

  // 缓存动画
  animationCache.set(key, gltf.animations[0]);

  return gltf.animations[0];
}
```

---

## Unity 集成

如果使用 Unity SDK，可以通过 HTTP 请求获取角色配置：

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

public class CharacterLoader : MonoBehaviour
{
    [System.Serializable]
    public class CharacterData
    {
        public string id;
        public string name;
        public string persona;
        public ModelConfig modelConfig;
    }

    [System.Serializable]
    public class ModelConfig
    {
        public string modelUrl;
        public string thumbnailUrl;
        public float scale;
    }

    void Start()
    {
        StartCoroutine(LoadCharacter("cheerful"));
    }

    IEnumerator LoadCharacter(string persona)
    {
        string url = "http://localhost:3000/characters";

        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                string json = request.downloadHandler.text;
                // 解析 JSON，找到对应 persona 的角色
                // 下载 GLTF 模型
                // 实例化角色
            }
            else
            {
                Debug.LogError($"Failed to load character: {request.error}");
            }
        }
    }
}
```

---

## Unreal Engine 集成

```cpp
// CharacterLoader.h
#pragma once

#include "CoreMinimal.h"
#include "Http.h"
#include "GameFramework/Actor.h"
#include "CharacterLoader.generated.h"

UCLASS()
class ACharacterLoader : public AActor
{
    GENERATED_BODY()

public:
    ACharacterLoader();

    UFUNCTION(BlueprintCallable, Category = "Character")
    void LoadCharacter(FString Persona);

private:
    void OnCharacterDataReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
};

// CharacterLoader.cpp
void ACharacterLoader::LoadCharacter(FString Persona)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TEXT("http://localhost:3000/characters"));
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->OnProcessRequestComplete().BindUObject(this, &ACharacterLoader::OnCharacterDataReceived);
    Request->ProcessRequest();
}

void ACharacterLoader::OnCharacterDataReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid())
    {
        FString JsonString = Response->GetContentAsString();
        // 解析 JSON
        // 加载 GLTF 模型
        // 创建角色
    }
}
```

---

## 环境变量配置

### 开发环境

`.env.development`:
```bash
API_SERVICE_URL=http://localhost:3000
CDN_BASE_URL=http://localhost:3000/assets/models  # 本地测试
```

### 生产环境

`.env.production`:
```bash
API_SERVICE_URL=https://api.yourapp.com
CDN_BASE_URL=https://cdn.yourapp.com/agl/models  # 真实 CDN
```

---

## API 响应格式

### GET /characters

**Response**:
```json
{
  "characters": [
    {
      "id": "1",
      "name": "Cheerful Companion",
      "persona": "cheerful",
      "description": "An energetic and positive companion who celebrates your victories",
      "gender": "female",
      "modelConfig": {
        "modelUrl": "https://cdn.example.com/agl/models/cheerful/model.gltf",
        "thumbnailUrl": "https://cdn.example.com/agl/models/cheerful/thumbnail.png",
        "previewUrl": "https://cdn.example.com/agl/models/cheerful/preview.png",
        "scale": 1.0,
        "position": { "x": 0, "y": 0, "z": 0 },
        "animations": {
          "idle": "https://cdn.example.com/agl/models/cheerful/animations/idle.gltf",
          "happy_subtle": "https://cdn.example.com/agl/models/cheerful/animations/happy_subtle.gltf",
          "happy_normal": "https://cdn.example.com/agl/models/cheerful/animations/happy_normal.gltf",
          "happy_intense": "https://cdn.example.com/agl/models/cheerful/animations/happy_intense.gltf",
          ...
        },
        "avatarSettings": {
          "shadows": true,
          "antialias": true,
          "autoRotate": false
        }
      },
      "voiceConfig": {
        "defaultVoice": "nova",
        "language": "zh-CN",
        "speed": 1.0
      }
    },
    ...
  ]
}
```

---

## 故障排查

### 问题1: CORS 错误

**症状**: 无法从 CDN 加载模型，浏览器控制台显示 CORS 错误

**解决**:
1. 检查 CDN 的 CORS 配置
2. 确保返回 `Access-Control-Allow-Origin: *` 头
3. 本地开发时可使用代理

### 问题2: 模型加载缓慢

**症状**: 首次加载角色需要很长时间

**解决**:
1. 使用 Draco 压缩模型
2. 启用浏览器缓存 (`Cache-Control`)
3. 使用 `preloadModel()` 预加载
4. 考虑使用 Service Worker

### 问题3: 动画不流畅

**症状**: 角色动画卡顿或跳跃

**解决**:
1. 检查动画 FPS 设置
2. 确保动画文件完整
3. 使用 `AnimationMixer.update()` 更新动画

---

## 性能监控

```tsx
import { useState, useEffect } from 'react';

function PerformanceMonitor({ avatarRef }) {
  const [metrics, setMetrics] = useState({ fps: 0, drawCalls: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (avatarRef.current) {
        const stats = avatarRef.current.getPerformanceMetrics();
        setMetrics(stats);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [avatarRef]);

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 10 }}>
      <div>FPS: {metrics.fps}</div>
      <div>Draw Calls: {metrics.drawCalls}</div>
    </div>
  );
}
```

---

## 总结

### 集成步骤清单

- [ ] 配置 `CDN_BASE_URL` 环境变量
- [ ] 准备 3D 模型资源（见 `3D-MODEL-SETUP-GUIDE.md`）
- [ ] 从 Character API 获取角色配置
- [ ] 使用 Avatar SDK 渲染角色
- [ ] 监听 Emotion/Dialogue 事件更新角色状态
- [ ] 实现语音合成（可选）
- [ ] 添加性能监控
- [ ] 测试和优化

### 相关文档

- [Avatar SDK README](./README.md) - Avatar SDK 完整文档
- [3D Model Setup Guide](../../docs/3D-MODEL-SETUP-GUIDE.md) - 3D 模型准备指南
- [API Documentation](../../docs/api/README.md) - API 接口文档

---

**需要帮助？** 查看示例代码或联系开发团队。
