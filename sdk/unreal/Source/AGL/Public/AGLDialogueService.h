// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Interfaces/IHttpRequest.h"
#include "AGLTypes.h"
#include "AGLDialogueService.generated.h"

/** Delegate for dialogue generation completion */
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnDialogueGenerationComplete, bool, bSuccess, const FAGLDialogueResponse&, Response);

/**
 * Service for generating dynamic NPC dialogue
 *
 * This service communicates with the AGL Dialogue Service to create
 * context-aware, emotionally appropriate dialogue.
 *
 * Example usage:
 *
 *   UAGLDialogueService* Service = Client->GetDialogueService();
 *   FAGLDialogueRequest Request;
 *   Request.EventType = EAGLEventType::Victory;
 *   Request.Emotion = EAGLEmotionType::Excited;
 *   Request.Persona = EAGLPersona::Cheerful;
 *   Service->GenerateDialogue(Request, OnComplete);
 */
UCLASS(BlueprintType)
class AGL_API UAGLDialogueService : public UObject
{
    GENERATED_BODY()

    // Friend test classes for testing protected members
    friend class FAGLEnumConversionTest;
    friend class FAGLDialogueRequestSerializationTest;
    friend class FAGLDialogueResponseDeserializationTest;

public:
    /**
     * Initialize the service
     * @param InServiceUrl Service base URL
     * @param InApiKey API key for authentication
     * @param InTimeout Request timeout in seconds
     */
    void Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout);

    /**
     * Generate dialogue for a game event
     * @param Request Dialogue generation request
     * @param OnComplete Callback when generation is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Dialogue")
    void GenerateDialogue(const FAGLDialogueRequest& Request, FOnDialogueGenerationComplete OnComplete);

protected:
    /** Service URL */
    FString ServiceUrl;

    /** API key */
    FString ApiKey;

    /** Request timeout */
    float Timeout;

    /** Handle HTTP response */
    void HandleDialogueResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, FOnDialogueGenerationComplete Callback);

    /** Convert event type enum to string */
    static FString EventTypeToString(EAGLEventType EventType);

    /** Convert emotion type enum to string */
    static FString EmotionTypeToString(EAGLEmotionType EmotionType);

    /** Convert persona enum to string */
    static FString PersonaToString(EAGLPersona Persona);

    /** Serialize request to JSON */
    FString SerializeRequest(const FAGLDialogueRequest& Request);

    /** Deserialize response from JSON */
    FAGLDialogueResponse DeserializeResponse(const FString& JsonString);
};
