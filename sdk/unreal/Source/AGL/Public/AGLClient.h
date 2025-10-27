// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "AGLTypes.h"
#include "AGLEmotionService.h"
#include "AGLDialogueService.h"
#include "AGLMemoryService.h"
#include "AGLClient.generated.h"

/**
 * Main AGL Client for interacting with the AI Game Companion Engine
 *
 * This class provides access to emotion analysis, dialogue generation,
 * and memory management services.
 *
 * Example usage:
 *
 *   UAGLClient* Client = NewObject<UAGLClient>();
 *   FAGLConfig Config;
 *   Config.ApiKey = TEXT("your-api-key");
 *   Client->Initialize(Config);
 *
 *   Client->SetPlayerId(TEXT("player-123"));
 *   Client->GetEmotionService()->AnalyzeEmotion(Request, Delegate);
 */
UCLASS(BlueprintType)
class AGL_API UAGLClient : public UObject
{
    GENERATED_BODY()

public:
    /**
     * Initialize the AGL client with configuration
     * @param InConfig Configuration settings
     */
    UFUNCTION(BlueprintCallable, Category = "AGL")
    void Initialize(const FAGLConfig& InConfig);

    /**
     * Set the current player ID
     * @param InPlayerId Player identifier
     */
    UFUNCTION(BlueprintCallable, Category = "AGL")
    void SetPlayerId(const FString& InPlayerId);

    /**
     * Set the current game ID
     * @param InGameId Game identifier
     */
    UFUNCTION(BlueprintCallable, Category = "AGL")
    void SetGameId(const FString& InGameId);

    /**
     * Get the current player ID
     * @return Player ID or empty string if not set
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    FString GetPlayerId() const { return PlayerId; }

    /**
     * Get the current game ID
     * @return Game ID or empty string if not set
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    FString GetGameId() const { return GameId; }

    /**
     * Get the emotion service
     * @return Emotion service instance
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    UAGLEmotionService* GetEmotionService() const { return EmotionService; }

    /**
     * Get the dialogue service
     * @return Dialogue service instance
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    UAGLDialogueService* GetDialogueService() const { return DialogueService; }

    /**
     * Get the memory service
     * @return Memory service instance
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    UAGLMemoryService* GetMemoryService() const { return MemoryService; }

    /**
     * Get the current configuration
     * @return Configuration settings
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    FAGLConfig GetConfig() const { return Config; }

    /**
     * Check if client is initialized
     * @return True if initialized
     */
    UFUNCTION(BlueprintPure, Category = "AGL")
    bool IsInitialized() const { return bInitialized; }

protected:
    /** Configuration */
    UPROPERTY()
    FAGLConfig Config;

    /** Current player ID */
    UPROPERTY()
    FString PlayerId;

    /** Current game ID */
    UPROPERTY()
    FString GameId;

    /** Emotion service instance */
    UPROPERTY()
    UAGLEmotionService* EmotionService;

    /** Dialogue service instance */
    UPROPERTY()
    UAGLDialogueService* DialogueService;

    /** Memory service instance */
    UPROPERTY()
    UAGLMemoryService* MemoryService;

    /** Whether client is initialized */
    bool bInitialized = false;
};
