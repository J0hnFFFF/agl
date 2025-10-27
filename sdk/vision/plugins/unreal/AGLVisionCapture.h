/**
 * AGL Vision Capture - Unreal Engine Plugin
 *
 * Header file for screen capture functionality
 *
 * Place in: [YourProject]/Plugins/AGLVision/Source/AGLVision/Public/
 *
 * @author AGL Team
 * @version 0.1.0
 */

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Engine/TextureRenderTarget2D.h"
#include "ImageUtils.h"
#include "AGLVisionCapture.generated.h"

/**
 * Actor that captures viewport screenshots and sends them to JavaScript for vision analysis
 */
UCLASS(Blueprintable, BlueprintType)
class AGLVISION_API AAGLVisionCapture : public AActor
{
	GENERATED_BODY()

public:
	// Sets default values for this actor's properties
	AAGLVisionCapture();

protected:
	// Called when the game starts or when spawned
	virtual void BeginPlay() override;

	// Called when destroyed
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

public:
	// Called every frame
	virtual void Tick(float DeltaTime) override;

	//~ Begin Capture Settings

	/** Resolution width for captured screenshots */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Capture", meta = (ClampMin = "640", ClampMax = "3840"))
	int32 CaptureWidth = 1920;

	/** Resolution height for captured screenshots */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Capture", meta = (ClampMin = "480", ClampMax = "2160"))
	int32 CaptureHeight = 1080;

	/** JPEG compression quality (1-100) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Capture", meta = (ClampMin = "1", ClampMax = "100"))
	int32 JPEGQuality = 80;

	/** Time in seconds between automatic captures */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Capture", meta = (ClampMin = "0.1", ClampMax = "10.0"))
	float CaptureInterval = 1.0f;

	/** Start capturing automatically when BeginPlay is called */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Capture")
	bool bAutoStart = true;

	/** Enable debug logging */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL Vision|Debug")
	bool bEnableDebug = false;

	//~ End Capture Settings

	//~ Begin Public Functions

	/** Start automatic screen capture */
	UFUNCTION(BlueprintCallable, Category = "AGL Vision")
	void StartCapture();

	/** Stop automatic screen capture */
	UFUNCTION(BlueprintCallable, Category = "AGL Vision")
	void StopCapture();

	/** Capture a single screenshot immediately */
	UFUNCTION(BlueprintCallable, Category = "AGL Vision")
	void CaptureNow();

	/** Check if capture is currently running */
	UFUNCTION(BlueprintPure, Category = "AGL Vision")
	bool IsCapturing() const { return bIsCapturing; }

	//~ End Public Functions

private:
	/** Render target for capturing */
	UPROPERTY(Transient)
	UTextureRenderTarget2D* RenderTarget;

	/** Timer for automatic capture */
	FTimerHandle CaptureTimerHandle;

	/** Is capture currently active */
	bool bIsCapturing;

	/** Accumulator for delta time */
	float TimeAccumulator;

	/** Perform the actual capture and send to JavaScript */
	void PerformCapture();

	/** Send base64 data to JavaScript */
	void SendToJavaScript(const FString& Base64Data);

	/** Initialize render target */
	void InitializeRenderTarget();

	/** Cleanup render target */
	void CleanupRenderTarget();
};
