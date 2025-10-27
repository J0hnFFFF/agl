// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Interfaces/IHttpRequest.h"
#include "AGLTypes.h"
#include "AGLMemoryService.generated.h"

/** Delegate for memory creation completion */
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnMemoryCreated, bool, bSuccess, const FAGLMemory&, Memory);

/** Delegate for memory search completion */
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnMemorySearchComplete, bool, bSuccess, const TArray<FAGLMemorySearchResult>&, Results);

/** Delegate for get memories completion */
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnGetMemoriesComplete, bool, bSuccess, const TArray<FAGLMemory>&, Memories);

/**
 * Service for managing player memories
 *
 * This service communicates with the AGL Memory Service to store and
 * retrieve player memories using semantic search.
 *
 * Example usage:
 *
 *   UAGLMemoryService* Service = Client->GetMemoryService();
 *   FAGLCreateMemoryRequest Request;
 *   Request.Type = EAGLMemoryType::Achievement;
 *   Request.Content = TEXT("Won first match");
 *   Request.Importance = 8;
 *   Service->CreateMemory(TEXT("player-123"), Request, OnComplete);
 */
UCLASS(BlueprintType)
class AGL_API UAGLMemoryService : public UObject
{
    GENERATED_BODY()

    // Friend test classes for testing protected members
    friend class FAGLEnumConversionTest;
    friend class FAGLMemorySerializationTest;

public:
    /**
     * Initialize the service
     * @param InServiceUrl Service base URL
     * @param InApiKey API key for authentication
     * @param InTimeout Request timeout in seconds
     */
    void Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout);

    /**
     * Create a new memory for a player
     * @param PlayerId Player identifier
     * @param Request Memory creation request
     * @param OnComplete Callback when creation is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Memory")
    void CreateMemory(const FString& PlayerId, const FAGLCreateMemoryRequest& Request, FOnMemoryCreated OnComplete);

    /**
     * Search player memories using semantic search
     * @param PlayerId Player identifier
     * @param Request Search request
     * @param OnComplete Callback when search is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Memory")
    void SearchMemories(const FString& PlayerId, const FAGLSearchMemoriesRequest& Request, FOnMemorySearchComplete OnComplete);

    /**
     * Get relevant memories for the current context
     * @param PlayerId Player identifier
     * @param Request Context request
     * @param OnComplete Callback when retrieval is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Memory")
    void GetContext(const FString& PlayerId, const FAGLGetContextRequest& Request, FOnGetMemoriesComplete OnComplete);

    /**
     * Get recent memories for a player
     * @param PlayerId Player identifier
     * @param Limit Maximum number of memories to retrieve
     * @param Offset Pagination offset
     * @param OnComplete Callback when retrieval is complete
     */
    UFUNCTION(BlueprintCallable, Category = "AGL|Memory")
    void GetMemories(const FString& PlayerId, int32 Limit = 10, int32 Offset = 0, FOnGetMemoriesComplete OnComplete);

protected:
    /** Service URL */
    FString ServiceUrl;

    /** API key */
    FString ApiKey;

    /** Request timeout */
    float Timeout;

    /** Handle create memory response */
    void HandleCreateMemoryResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, FOnMemoryCreated Callback);

    /** Handle search memories response */
    void HandleSearchMemoriesResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, FOnMemorySearchComplete Callback);

    /** Handle get memories response */
    void HandleGetMemoriesResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful, FOnGetMemoriesComplete Callback);

    /** Convert memory type enum to string */
    static FString MemoryTypeToString(EAGLMemoryType MemoryType);

    /** Convert string to memory type enum */
    static EAGLMemoryType StringToMemoryType(const FString& TypeString);

    /** Serialize create memory request to JSON */
    FString SerializeCreateMemoryRequest(const FAGLCreateMemoryRequest& Request);

    /** Serialize search request to JSON */
    FString SerializeSearchRequest(const FAGLSearchMemoriesRequest& Request);

    /** Serialize context request to JSON */
    FString SerializeContextRequest(const FAGLGetContextRequest& Request);

    /** Deserialize memory from JSON */
    FAGLMemory DeserializeMemory(const TSharedPtr<FJsonObject>& JsonObject);

    /** Deserialize search results from JSON */
    TArray<FAGLMemorySearchResult> DeserializeSearchResults(const FString& JsonString);

    /** Deserialize memories array from JSON */
    TArray<FAGLMemory> DeserializeMemories(const FString& JsonString);
};
