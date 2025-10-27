/**
 * AGL Vision Capture - Unreal Engine Plugin
 *
 * Implementation file for screen capture functionality
 *
 * Place in: [YourProject]/Plugins/AGLVision/Source/AGLVision/Private/
 *
 * @author AGL Team
 * @version 0.1.0
 */

#include "AGLVisionCapture.h"
#include "Engine/GameViewportClient.h"
#include "Engine/World.h"
#include "TimerManager.h"
#include "Misc/Base64.h"
#include "ImageUtils.h"
#include "IImageWrapper.h"
#include "IImageWrapperModule.h"
#include "Modules/ModuleManager.h"

// HTML5 (WebAssembly) JavaScript interop
#if PLATFORM_HTML5
#include <emscripten.h>

// JavaScript function declaration
EM_JS(void, JS_CaptureScreen, (const char* base64Data), {
	if (typeof window.CaptureScreen === 'function') {
		window.CaptureScreen(UTF8ToString(base64Data));
	} else {
		console.warn('[AGLVision] window.CaptureScreen is not defined');
	}
});
#endif

AAGLVisionCapture::AAGLVisionCapture()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = true;

	bIsCapturing = false;
	TimeAccumulator = 0.0f;

	// Set default values
	CaptureWidth = 1920;
	CaptureHeight = 1080;
	JPEGQuality = 80;
	CaptureInterval = 1.0f;
	bAutoStart = true;
	bEnableDebug = false;
}

void AAGLVisionCapture::BeginPlay()
{
	Super::BeginPlay();

	InitializeRenderTarget();

	if (bAutoStart)
	{
		StartCapture();
	}

	if (bEnableDebug)
	{
		UE_LOG(LogTemp, Log, TEXT("[AGLVision] Initialized - Resolution: %dx%d, Interval: %.2fs"),
			CaptureWidth, CaptureHeight, CaptureInterval);
	}
}

void AAGLVisionCapture::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	StopCapture();
	CleanupRenderTarget();

	Super::EndPlay(EndPlayReason);
}

void AAGLVisionCapture::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Manual timing (alternative to timer for more control)
	if (bIsCapturing)
	{
		TimeAccumulator += DeltaTime;

		if (TimeAccumulator >= CaptureInterval)
		{
			TimeAccumulator = 0.0f;
			PerformCapture();
		}
	}
}

void AAGLVisionCapture::StartCapture()
{
	if (bIsCapturing)
	{
		UE_LOG(LogTemp, Warning, TEXT("[AGLVision] Capture already running"));
		return;
	}

	bIsCapturing = true;
	TimeAccumulator = 0.0f;

	if (bEnableDebug)
	{
		UE_LOG(LogTemp, Log, TEXT("[AGLVision] Started capture loop"));
	}
}

void AAGLVisionCapture::StopCapture()
{
	if (!bIsCapturing)
	{
		return;
	}

	bIsCapturing = false;

	if (bEnableDebug)
	{
		UE_LOG(LogTemp, Log, TEXT("[AGLVision] Stopped capture loop"));
	}
}

void AAGLVisionCapture::CaptureNow()
{
	PerformCapture();
}

void AAGLVisionCapture::InitializeRenderTarget()
{
	if (!RenderTarget)
	{
		RenderTarget = NewObject<UTextureRenderTarget2D>(this);
		RenderTarget->InitAutoFormat(CaptureWidth, CaptureHeight);
		RenderTarget->UpdateResourceImmediate(true);

		if (bEnableDebug)
		{
			UE_LOG(LogTemp, Log, TEXT("[AGLVision] Created render target %dx%d"),
				CaptureWidth, CaptureHeight);
		}
	}
}

void AAGLVisionCapture::CleanupRenderTarget()
{
	if (RenderTarget)
	{
		RenderTarget->ConditionalBeginDestroy();
		RenderTarget = nullptr;
	}
}

void AAGLVisionCapture::PerformCapture()
{
	if (!RenderTarget)
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] Render target not initialized"));
		return;
	}

	UWorld* World = GetWorld();
	if (!World)
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] World not found"));
		return;
	}

	UGameViewportClient* ViewportClient = World->GetGameViewport();
	if (!ViewportClient)
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] Viewport client not found"));
		return;
	}

	// Capture viewport to render target
	FTextureRenderTargetResource* RenderTargetResource = RenderTarget->GameThread_GetRenderTargetResource();
	if (!RenderTargetResource)
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] Render target resource not found"));
		return;
	}

	// Read pixels from render target
	TArray<FColor> OutBMP;
	if (!RenderTargetResource->ReadPixels(OutBMP))
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] Failed to read pixels from render target"));
		return;
	}

	// Convert to JPEG
	TArray<uint8> CompressedData;
	IImageWrapperModule& ImageWrapperModule = FModuleManager::LoadModuleChecked<IImageWrapperModule>(FName("ImageWrapper"));
	TSharedPtr<IImageWrapper> ImageWrapper = ImageWrapperModule.CreateImageWrapper(EImageFormat::JPEG);

	if (ImageWrapper.IsValid() && ImageWrapper->SetRaw(OutBMP.GetData(), OutBMP.Num() * sizeof(FColor), CaptureWidth, CaptureHeight, ERGBFormat::BGRA, 8))
	{
		CompressedData = ImageWrapper->GetCompressed(JPEGQuality);

		if (CompressedData.Num() > 0)
		{
			// Convert to Base64
			FString Base64String = FBase64::Encode(CompressedData);

			// Send to JavaScript
			SendToJavaScript(Base64String);

			if (bEnableDebug)
			{
				UE_LOG(LogTemp, Log, TEXT("[AGLVision] Captured %d bytes (%d base64 chars)"),
					CompressedData.Num(), Base64String.Len());
			}
		}
		else
		{
			UE_LOG(LogTemp, Error, TEXT("[AGLVision] JPEG compression failed"));
		}
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("[AGLVision] Image wrapper setup failed"));
	}
}

void AAGLVisionCapture::SendToJavaScript(const FString& Base64Data)
{
#if PLATFORM_HTML5
	// Call JavaScript function
	JS_CaptureScreen(TCHAR_TO_ANSI(*Base64Data));
#else
	if (bEnableDebug)
	{
		UE_LOG(LogTemp, Warning, TEXT("[AGLVision] JavaScript interop only works on HTML5 platform"));
	}
#endif
}
