// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "AGLTypes.generated.h"

/**
 * Emotion types supported by AGL
 */
UENUM(BlueprintType)
enum class EAGLEmotionType : uint8
{
    Happy UMETA(DisplayName = "Happy"),
    Excited UMETA(DisplayName = "Excited"),
    Amazed UMETA(DisplayName = "Amazed"),
    Proud UMETA(DisplayName = "Proud"),
    Satisfied UMETA(DisplayName = "Satisfied"),
    Cheerful UMETA(DisplayName = "Cheerful"),
    Grateful UMETA(DisplayName = "Grateful"),
    Sad UMETA(DisplayName = "Sad"),
    Disappointed UMETA(DisplayName = "Disappointed"),
    Frustrated UMETA(DisplayName = "Frustrated"),
    Angry UMETA(DisplayName = "Angry"),
    Worried UMETA(DisplayName = "Worried"),
    Tired UMETA(DisplayName = "Tired"),
    Neutral UMETA(DisplayName = "Neutral")
};

/**
 * Event types for emotion analysis
 */
UENUM(BlueprintType)
enum class EAGLEventType : uint8
{
    Victory UMETA(DisplayName = "Victory"),
    Defeat UMETA(DisplayName = "Defeat"),
    Kill UMETA(DisplayName = "Kill"),
    Death UMETA(DisplayName = "Death"),
    Achievement UMETA(DisplayName = "Achievement"),
    LevelUp UMETA(DisplayName = "Level Up"),
    Loot UMETA(DisplayName = "Loot"),
    SessionStart UMETA(DisplayName = "Session Start"),
    SessionEnd UMETA(DisplayName = "Session End")
};

/**
 * NPC personality types
 */
UENUM(BlueprintType)
enum class EAGLPersona : uint8
{
    Cheerful UMETA(DisplayName = "Cheerful"),
    Cool UMETA(DisplayName = "Cool"),
    Cute UMETA(DisplayName = "Cute")
};

/**
 * Memory types
 */
UENUM(BlueprintType)
enum class EAGLMemoryType : uint8
{
    Achievement UMETA(DisplayName = "Achievement"),
    Milestone UMETA(DisplayName = "Milestone"),
    FirstTime UMETA(DisplayName = "First Time"),
    Dramatic UMETA(DisplayName = "Dramatic"),
    Conversation UMETA(DisplayName = "Conversation"),
    Event UMETA(DisplayName = "Event"),
    Observation UMETA(DisplayName = "Observation")
};

/**
 * Configuration for AGL client
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLConfig
{
    GENERATED_BODY()

    /** API key for authentication */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString ApiKey;

    /** Base URL for API service */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString ApiBaseUrl = TEXT("http://localhost:3000");

    /** Emotion service URL */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString EmotionServiceUrl = TEXT("http://localhost:8000");

    /** Dialogue service URL */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString DialogueServiceUrl = TEXT("http://localhost:8001");

    /** Memory service URL */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString MemoryServiceUrl = TEXT("http://localhost:3002");

    /** Request timeout in seconds */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float Timeout = 30.0f;
};

/**
 * Emotion analysis request
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLEmotionRequest
{
    GENERATED_BODY()

    /** Event type */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLEventType EventType;

    /** Event data (JSON) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TMap<FString, FString> Data;

    /** Additional context */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TMap<FString, FString> Context;

    /** Force ML-based analysis */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    bool bForceML = false;
};

/**
 * Emotion analysis response
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLEmotionResponse
{
    GENERATED_BODY()

    /** Detected emotion */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLEmotionType Emotion;

    /** Intensity (0.0 - 1.0) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float Intensity = 0.0f;

    /** Suggested action or animation */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Action;

    /** Confidence score (0.0 - 1.0) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float Confidence = 0.0f;

    /** Reasoning for the result */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Reasoning;

    /** Method used (rule, ml, cached) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Method;

    /** Cost in USD */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float Cost = 0.0f;

    /** Whether result was cached */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    bool bCacheHit = false;

    /** Processing latency in milliseconds */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 LatencyMs = 0;
};

/**
 * Dialogue generation request
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLDialogueRequest
{
    GENERATED_BODY()

    /** Event type */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLEventType EventType;

    /** Current emotion */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLEmotionType Emotion;

    /** NPC personality */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLPersona Persona;

    /** Player ID for memory context */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString PlayerId;

    /** Language code (zh, en, ja) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Language = TEXT("zh");

    /** Additional context */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TMap<FString, FString> Context;

    /** Force LLM generation */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    bool bForceLLM = false;
};

/**
 * Dialogue generation response
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLDialogueResponse
{
    GENERATED_BODY()

    /** Generated dialogue text */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Dialogue;

    /** Generation method (template, llm, cached) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Method;

    /** Cost in USD */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float Cost = 0.0f;

    /** Whether special case was used */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    bool bUsedSpecialCase = false;

    /** Special case reasons */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TArray<FString> SpecialCaseReasons;

    /** Number of memories used */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 MemoryCount = 0;

    /** Whether result was cached */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    bool bCacheHit = false;

    /** Processing latency in milliseconds */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 LatencyMs = 0;
};

/**
 * Memory creation request
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLCreateMemoryRequest
{
    GENERATED_BODY()

    /** Memory type */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLMemoryType Type;

    /** Memory content */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Content;

    /** Associated emotion */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Emotion;

    /** Additional context */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TMap<FString, FString> Context;

    /** Importance score (0-10) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 Importance = 5;
};

/**
 * Memory object
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLMemory
{
    GENERATED_BODY()

    /** Memory ID */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Id;

    /** Player ID */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString PlayerId;

    /** Memory type */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    EAGLMemoryType Type;

    /** Memory content */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Content;

    /** Associated emotion */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Emotion;

    /** Importance score */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 Importance = 0;

    /** Additional context */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    TMap<FString, FString> Context;

    /** Creation timestamp */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString CreatedAt;
};

/**
 * Memory search result
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLMemorySearchResult
{
    GENERATED_BODY()

    /** The memory object */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FAGLMemory Memory;

    /** Similarity score (0.0 - 1.0) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    float SimilarityScore = 0.0f;
};

/**
 * Memory search request
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLSearchMemoriesRequest
{
    GENERATED_BODY()

    /** Search query */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString Query;

    /** Maximum results */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 Limit = 10;
};

/**
 * Get context request
 */
USTRUCT(BlueprintType)
struct FAGL_API FAGLGetContextRequest
{
    GENERATED_BODY()

    /** Current event description */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    FString CurrentEvent;

    /** Maximum memories */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "AGL")
    int32 Limit = 5;
};
