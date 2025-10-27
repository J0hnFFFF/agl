// Copyright AGL Team. All Rights Reserved.

#include "AGLClient.h"
#include "AGLEmotionService.h"
#include "AGLDialogueService.h"
#include "AGLMemoryService.h"

void UAGLClient::Initialize(const FAGLConfig& InConfig)
{
    Config = InConfig;

    // Validate configuration
    if (Config.ApiKey.IsEmpty())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLClient: API key is required"));
        return;
    }

    // Create service instances
    EmotionService = NewObject<UAGLEmotionService>(this);
    EmotionService->Initialize(
        Config.EmotionServiceUrl,
        Config.ApiKey,
        Config.Timeout
    );

    DialogueService = NewObject<UAGLDialogueService>(this);
    DialogueService->Initialize(
        Config.DialogueServiceUrl,
        Config.ApiKey,
        Config.Timeout
    );

    MemoryService = NewObject<UAGLMemoryService>(this);
    MemoryService->Initialize(
        Config.MemoryServiceUrl,
        Config.ApiKey,
        Config.Timeout
    );

    bInitialized = true;

    UE_LOG(LogTemp, Log, TEXT("AGLClient initialized successfully"));
}

void UAGLClient::SetPlayerId(const FString& InPlayerId)
{
    PlayerId = InPlayerId;
    UE_LOG(LogTemp, Log, TEXT("AGLClient: Set player ID to %s"), *PlayerId);
}

void UAGLClient::SetGameId(const FString& InGameId)
{
    GameId = InGameId;
    UE_LOG(LogTemp, Log, TEXT("AGLClient: Set game ID to %s"), *GameId);
}
