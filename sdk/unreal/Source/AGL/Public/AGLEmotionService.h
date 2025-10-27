// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Interfaces/IHttpRequest.h"
#include "AGLTypes.h"
#include "AGLEmotionService.generated.h"

/** Delegate for emotion analysis completion */
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnEmotionAnalysisComplete, bool, bSuccess, const FAGLEmotionResponse&, Response);

/**
 * Service for analyzing player emotions based on game events
 *
 * This service communicates with the AGL Emotion Service to determine
 * emotional responses to player actions.
 *
 * Example usage:
 *
 *   UAGLEmotionService* Service = Client->GetEmotionService();
 *   FAGLEmotionRequest Request;
 *   Request.EventType = EAGLEventType::Victory;
 *   Service->AnalyzeEmotion(Request, OnComplete);
 */
UCLASS(BlueprintType)
class AGL_API UAGLEmotionService : public UObject
{
    GENERATED_BODY()

    // Friend test classes for testing protected members
    friend class FAGLEnumConversionTest;
    friend class FAGLEmotionRequestSerializationTest;
    friend class FAGLEmotionResponseDeserializationTest;

public:
    /**
     * Initialize the service
     * @param InServiceUrl Service base URL
     * @param InApiKey API key for authentication
     * @param InTimeout Request timeout in seconds
     */
    void Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout);

    /**
     * Analyze emotion for a game event
     * @param Request Emotion analysis request
     * @param OnComplete Callback when analysis is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Emotion")
    void AnalyzeEmotion(const FAGLEmotionRequest& Request, FOnEmotionAnalysisComplete OnComplete);

    /**
     * Create a victory emotion request (helper)
     * @param bIsMVP Whether player was MVP
     * @param WinStreak Current win streak
     * @return Configured emotion request
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Emotion")
    static FAGLEmotionRequest CreateVictoryRequest(bool bIsMVP = false, int32 WinStreak = 0);

    /**
     * Create a defeat emotion request (helper)
     * @param LossStreak Current loss streak
     * @return Configured emotion request
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Emotion")
    static FAGLEmotionRequest CreateDefeatRequest(int32 LossStreak = 0);

    /**
     * Create an achievement emotion request (helper)
     * @param Rarity Achievement rarity (common, epic, legendary)
     * @return Configured emotion request
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Emotion")
    static FAGLEmotionRequest CreateAchievementRequest(const FString& Rarity);

    /**
     * Create a kill emotion request (helper)
     * @param KillCount Total kills
     * @param bIsLegendary Whether this is a legendary kill
     * @return Configured emotion request
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Emotion")
    static FAGLEmotionRequest CreateKillRequest(int32 KillCount, bool bIsLegendary = false);

protected:
    /** Service URL */
    FString ServiceUrl;

    /** API key */
    FString ApiKey;

    /** Request timeout */
    float Timeout;

    /** Handle HTTP response */
    void HandleEmotionResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, FOnEmotionAnalysisComplete Callback);

    /** Convert event type enum to string */
    static FString EventTypeToString(EAGLEventType EventType);

    /** Convert string to emotion type enum */
    static EAGLEmotionType StringToEmotionType(const FString& EmotionString);

    /** Serialize request to JSON */
    FString SerializeRequest(const FAGLEmotionRequest& Request);

    /** Deserialize response from JSON */
    FAGLEmotionResponse DeserializeResponse(const FString& JsonString);
};
