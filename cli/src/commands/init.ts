import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/logger';
import { FileSystemUtils } from '../utils/fs-utils';
import { ConfigManager } from '../utils/config';

const execAsync = promisify(exec);

interface InitOptions {
  template: 'unity' | 'web' | 'unreal';
  path?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
}

/**
 * Initialize a new AGL project
 */
export async function initCommand(projectName: string | undefined, options: InitOptions): Promise<void> {
  try {
    Logger.banner();

    // Get project name
    if (!projectName) {
      projectName = await Logger.input('Project name:', 'my-agl-game');
    }

    // Validate project name
    const validation = FileSystemUtils.validateProjectName(projectName);
    if (!validation.valid) {
      Logger.error(`Invalid project name:`);
      validation.errors.forEach((err) => Logger.error(`  - ${err}`));
      process.exit(1);
    }

    // Determine project directory
    const projectDir = options.path ? path.resolve(options.path, projectName) : path.join(process.cwd(), projectName);

    // Check if directory exists and is not empty
    const isEmpty = await FileSystemUtils.isDirectoryEmpty(projectDir);
    if (!isEmpty) {
      const overwrite = await Logger.confirm(
        `Directory ${projectName} already exists and is not empty. Overwrite?`,
        false,
      );
      if (!overwrite) {
        Logger.info('Project initialization cancelled');
        process.exit(0);
      }
    }

    Logger.info(`Creating new AGL project: ${projectName}`);
    Logger.info(`Template: ${options.template}`);
    Logger.info(`Location: ${projectDir}`);
    console.log();

    Logger.startSpinner('Setting up project structure...');

    // Create project directory
    await FileSystemUtils.ensureEmptyDirectory(projectDir, true);

    // Create project structure based on template
    await createProjectStructure(projectDir, projectName, options.template);

    Logger.succeedSpinner('Project structure created');

    // Initialize git repository
    if (!options.skipGit) {
      Logger.startSpinner('Initializing git repository...');
      try {
        await execAsync('git init', { cwd: projectDir });
        await execAsync('git add .', { cwd: projectDir });
        await execAsync('git commit -m "Initial commit from AGL CLI"', { cwd: projectDir });
        Logger.succeedSpinner('Git repository initialized');
      } catch (error) {
        Logger.warn('Failed to initialize git repository (git may not be installed)');
      }
    }

    // Install dependencies
    if (!options.skipInstall && options.template === 'web') {
      Logger.startSpinner('Installing dependencies...');
      try {
        await execAsync('npm install', { cwd: projectDir });
        Logger.succeedSpinner('Dependencies installed');
      } catch (error) {
        Logger.failSpinner('Failed to install dependencies');
        Logger.warn('You can install dependencies manually by running: npm install');
      }
    }

    // Initialize AGL configuration
    Logger.startSpinner('Initializing AGL configuration...');
    await ConfigManager.init(
      {
        projectName,
        template: options.template,
        createdAt: new Date().toISOString(),
      },
      false,
    );
    Logger.succeedSpinner('AGL configuration initialized');

    // Success message
    console.log();
    Logger.box(
      `Project ${projectName} created successfully! 🎉

Next steps:
  1. cd ${projectName}
  2. Configure your API key in .agl.yml
  3. Start development: agl dev

Documentation: https://docs.agl.dev
Support: https://github.com/agl/cli/issues`,
      '✨ Success',
    );
  } catch (error: any) {
    Logger.error('Failed to initialize project', error);
    process.exit(1);
  }
}

/**
 * Create project structure based on template
 */
async function createProjectStructure(
  projectDir: string,
  projectName: string,
  template: 'unity' | 'web' | 'unreal',
): Promise<void> {
  switch (template) {
    case 'web':
      await createWebTemplate(projectDir, projectName);
      break;
    case 'unity':
      await createUnityTemplate(projectDir, projectName);
      break;
    case 'unreal':
      await createUnrealTemplate(projectDir, projectName);
      break;
  }
}

/**
 * Create Web project template
 */
async function createWebTemplate(projectDir: string, projectName: string): Promise<void> {
  // package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'AGL Web Game Project',
    main: 'src/index.ts',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      test: 'jest',
    },
    dependencies: {
      '@agl/web-sdk': '^1.0.0',
    },
    devDependencies: {
      typescript: '^5.3.3',
      vite: '^5.0.0',
      '@types/node': '^20.10.0',
    },
  };

  await FileSystemUtils.writeJSON(path.join(projectDir, 'package.json'), packageJson);

  // tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020', 'DOM'],
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: ['src/**/*'],
  };

  await FileSystemUtils.writeJSON(path.join(projectDir, 'tsconfig.json'), tsConfig);

  // index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

  await FileSystemUtils.createFile(path.join(projectDir, 'index.html'), indexHtml);

  // src/main.ts
  const mainTs = `import { AGLClient } from '@agl/web-sdk';

// Initialize AGL Client
const aglClient = new AGLClient({
  apiKey: 'your-api-key-here',
  // Configuration will be loaded from .agl.yml
});

// Example: Analyze player emotion
async function analyzeEmotion() {
  const response = await aglClient.emotion.analyze({
    type: 'player.victory',
    data: { mvp: true, winStreak: 5 },
  });

  console.log('Emotion:', response.emotion);
  console.log('Intensity:', response.intensity);
}

// Example: Generate dialogue
async function generateDialogue() {
  const response = await aglClient.dialogue.generate({
    eventType: 'player.victory',
    emotion: 'excited',
    persona: 'cheerful',
    language: 'en',
  });

  console.log('Dialogue:', response.dialogue);
}

// Initialize your game here
console.log('AGL Game initialized!');
console.log('Ready to create amazing AI companions!');
`;

  await FileSystemUtils.createFile(path.join(projectDir, 'src', 'main.ts'), mainTs);

  // .gitignore
  const gitignore = `node_modules/
dist/
.env
.agl.yml
*.log
.DS_Store
`;

  await FileSystemUtils.createFile(path.join(projectDir, '.gitignore'), gitignore);

  // README.md
  const readme = `# ${projectName}

AGL Web Game Project

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your API key in \`.agl.yml\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Documentation

- [AGL Web SDK Documentation](https://docs.agl.dev/sdk/web)
- [API Reference](https://docs.agl.dev/api)
- [Examples](https://docs.agl.dev/examples)

## Support

For issues and questions, visit:
https://github.com/agl/cli/issues
`;

  await FileSystemUtils.createFile(path.join(projectDir, 'README.md'), readme);
}

/**
 * Create Unity project template
 */
async function createUnityTemplate(projectDir: string, projectName: string): Promise<void> {
  // Unity project structure
  await FileSystemUtils.createFile(
    path.join(projectDir, 'Assets', 'Scripts', 'AGLManager.cs'),
    `using UnityEngine;
using AGL;

public class AGLManager : MonoBehaviour
{
    private AGLClient client;

    void Start()
    {
        // Initialize AGL Client
        client = new AGLClient(new AGLConfig
        {
            ApiKey = "your-api-key-here",
            // Configuration will be loaded from .agl.yml
        });

        Debug.Log("AGL Client initialized!");
    }

    public async void AnalyzeEmotion()
    {
        var response = await client.Emotion.AnalyzeAsync(new EmotionRequest
        {
            Type = EventType.PlayerVictory,
            Data = new { mvp = true, winStreak = 5 }
        });

        Debug.Log($"Emotion: {response.Emotion}");
        Debug.Log($"Intensity: {response.Intensity}");
    }
}
`,
  );

  // README.md
  const readme = `# ${projectName}

AGL Unity Game Project

## Getting Started

1. Open the project in Unity
2. Configure your API key in \`.agl.yml\`
3. Attach AGLManager script to a GameObject
4. Start building!

## Documentation

- [AGL Unity SDK Documentation](https://docs.agl.dev/sdk/unity)
- [API Reference](https://docs.agl.dev/api)
- [Examples](https://docs.agl.dev/examples)

## Support

For issues and questions, visit:
https://github.com/agl/cli/issues
`;

  await FileSystemUtils.createFile(path.join(projectDir, 'README.md'), readme);

  // .gitignore
  const gitignore = `[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/

# Unity cache
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb

# Unity auto generated files
ExportedObj/
.consulo/
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb.meta
*.pdb.meta
*.mdb.meta

# AGL
.agl.yml
`;

  await FileSystemUtils.createFile(path.join(projectDir, '.gitignore'), gitignore);
}

/**
 * Create Unreal project template
 */
async function createUnrealTemplate(projectDir: string, projectName: string): Promise<void> {
  // Unreal project structure
  await FileSystemUtils.createFile(
    path.join(projectDir, 'Source', projectName, 'AGLManager.h'),
    `#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AGL/AGLClient.h"
#include "AGLManager.generated.h"

UCLASS()
class ${projectName.toUpperCase()}_API AAGLManager : public AActor
{
    GENERATED_BODY()

public:
    AAGLManager();

protected:
    virtual void BeginPlay() override;

private:
    TSharedPtr<UAGLClient> AGLClient;

public:
    UFUNCTION(BlueprintCallable)
    void AnalyzeEmotion();
};
`,
  );

  await FileSystemUtils.createFile(
    path.join(projectDir, 'Source', projectName, 'AGLManager.cpp'),
    `#include "AGLManager.h"

AAGLManager::AAGLManager()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AAGLManager::BeginPlay()
{
    Super::BeginPlay();

    // Initialize AGL Client
    FAGLConfig Config;
    Config.ApiKey = TEXT("your-api-key-here");

    AGLClient = MakeShared<UAGLClient>(Config);

    UE_LOG(LogTemp, Log, TEXT("AGL Client initialized!"));
}

void AAGLManager::AnalyzeEmotion()
{
    if (!AGLClient)
    {
        UE_LOG(LogTemp, Error, TEXT("AGL Client not initialized"));
        return;
    }

    FEmotionRequest Request;
    Request.Type = EEventType::PlayerVictory;
    Request.Data = TEXT("{\"mvp\": true, \"winStreak\": 5}");

    // Async call
    AGLClient->EmotionService->AnalyzeAsync(Request, [](const FEmotionResponse& Response)
    {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s"), *Response.Emotion);
        UE_LOG(LogTemp, Log, TEXT("Intensity: %f"), Response.Intensity);
    });
}
`,
  );

  // README.md
  const readme = `# ${projectName}

AGL Unreal Game Project

## Getting Started

1. Open the project in Unreal Engine
2. Configure your API key in \`.agl.yml\`
3. Add AGLManager to your level
4. Start building!

## Documentation

- [AGL Unreal SDK Documentation](https://docs.agl.dev/sdk/unreal)
- [API Reference](https://docs.agl.dev/api)
- [Examples](https://docs.agl.dev/examples)

## Support

For issues and questions, visit:
https://github.com/agl/cli/issues
`;

  await FileSystemUtils.createFile(path.join(projectDir, 'README.md'), readme);

  // .gitignore
  const gitignore = `# Unreal generated
Binaries/
DerivedDataCache/
Intermediate/
Saved/
*.VC.db
*.opensdf
*.opendb
*.sdf
*.sln
*.suo
*.xcodeproj
*.xcworkspace

# AGL
.agl.yml
`;

  await FileSystemUtils.createFile(path.join(projectDir, '.gitignore'), gitignore);
}
