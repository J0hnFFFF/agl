// Copyright AGL Team. All Rights Reserved.

#include "AGLMemoryService.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"
#include "JsonUtilities.h"

void UAGLMemoryService::Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout)
{
    ServiceUrl = InServiceUrl;
    ApiKey = InApiKey;
    Timeout = InTimeout;

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService initialized with URL: %s"), *ServiceUrl);
}

void UAGLMemoryService::CreateMemory(const FString& PlayerId, const FAGLCreateMemoryRequest& Request, FOnMemoryCreated OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    FString URL = FString::Printf(TEXT("%s/players/%s/memories"), *ServiceUrl, *PlayerId);
    HttpRequest->SetURL(URL);
    HttpRequest->SetVerb(TEXT("POST"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetHeader(TEXT("X-API-Key"), ApiKey);
    HttpRequest->SetTimeout(Timeout);

    // Serialize request to JSON
    FString JsonPayload = SerializeCreateMemoryRequest(Request);
    HttpRequest->SetContentAsString(JsonPayload);

    // Bind response handler
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this, OnComplete](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            HandleCreateMemoryResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Creating memory for player %s"), *PlayerId);
}

void UAGLMemoryService::SearchMemories(const FString& PlayerId, const FAGLSearchMemoriesRequest& Request, FOnMemorySearchComplete OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    FString URL = FString::Printf(TEXT("%s/players/%s/memories/search"), *ServiceUrl, *PlayerId);
    HttpRequest->SetURL(URL);
    HttpRequest->SetVerb(TEXT("POST"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetHeader(TEXT("X-API-Key"), ApiKey);
    HttpRequest->SetTimeout(Timeout);

    // Serialize request to JSON
    FString JsonPayload = SerializeSearchRequest(Request);
    HttpRequest->SetContentAsString(JsonPayload);

    // Bind response handler
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this, OnComplete](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            HandleSearchMemoriesResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Searching memories for player %s"), *PlayerId);
}

void UAGLMemoryService::GetContext(const FString& PlayerId, const FAGLGetContextRequest& Request, FOnGetMemoriesComplete OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    FString URL = FString::Printf(TEXT("%s/players/%s/memories/context"), *ServiceUrl, *PlayerId);
    HttpRequest->SetURL(URL);
    HttpRequest->SetVerb(TEXT("POST"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetHeader(TEXT("X-API-Key"), ApiKey);
    HttpRequest->SetTimeout(Timeout);

    // Serialize request to JSON
    FString JsonPayload = SerializeContextRequest(Request);
    HttpRequest->SetContentAsString(JsonPayload);

    // Bind response handler
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this, OnComplete](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            HandleGetMemoriesResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Getting context for player %s"), *PlayerId);
}

void UAGLMemoryService::GetMemories(const FString& PlayerId, int32 Limit, int32 Offset, FOnGetMemoriesComplete OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    FString URL = FString::Printf(TEXT("%s/players/%s/memories?limit=%d&offset=%d"),
        *ServiceUrl, *PlayerId, Limit, Offset);
    HttpRequest->SetURL(URL);
    HttpRequest->SetVerb(TEXT("GET"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetHeader(TEXT("X-API-Key"), ApiKey);
    HttpRequest->SetTimeout(Timeout);

    // Bind response handler
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this, OnComplete](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            HandleGetMemoriesResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Getting memories for player %s"), *PlayerId);
}

void UAGLMemoryService::HandleCreateMemoryResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bWasSuccessful,
    FOnMemoryCreated Callback)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Create memory request failed"));
        FAGLMemory EmptyMemory;
        Callback.ExecuteIfBound(false, EmptyMemory);
        return;
    }

    if (Response->GetResponseCode() != 200 && Response->GetResponseCode() != 201)
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Server returned error %d"), Response->GetResponseCode());
        FAGLMemory EmptyMemory;
        Callback.ExecuteIfBound(false, EmptyMemory);
        return;
    }

    // Parse response
    FString ResponseContent = Response->GetContentAsString();
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ResponseContent);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to parse create memory response JSON"));
        FAGLMemory EmptyMemory;
        Callback.ExecuteIfBound(false, EmptyMemory);
        return;
    }

    FAGLMemory Memory = DeserializeMemory(JsonObject);
    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Memory created with ID %s"), *Memory.Id);

    Callback.ExecuteIfBound(true, Memory);
}

void UAGLMemoryService::HandleSearchMemoriesResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bWasSuccessful,
    FOnMemorySearchComplete Callback)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Search memories request failed"));
        TArray<FAGLMemorySearchResult> EmptyResults;
        Callback.ExecuteIfBound(false, EmptyResults);
        return;
    }

    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Server returned error %d"), Response->GetResponseCode());
        TArray<FAGLMemorySearchResult> EmptyResults;
        Callback.ExecuteIfBound(false, EmptyResults);
        return;
    }

    // Parse response
    FString ResponseContent = Response->GetContentAsString();
    TArray<FAGLMemorySearchResult> Results = DeserializeSearchResults(ResponseContent);

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Found %d search results"), Results.Num());

    Callback.ExecuteIfBound(true, Results);
}

void UAGLMemoryService::HandleGetMemoriesResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bWasSuccessful,
    FOnGetMemoriesComplete Callback)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Get memories request failed"));
        TArray<FAGLMemory> EmptyMemories;
        Callback.ExecuteIfBound(false, EmptyMemories);
        return;
    }

    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Error, TEXT("AGLMemoryService: Server returned error %d"), Response->GetResponseCode());
        TArray<FAGLMemory> EmptyMemories;
        Callback.ExecuteIfBound(false, EmptyMemories);
        return;
    }

    // Parse response
    FString ResponseContent = Response->GetContentAsString();
    TArray<FAGLMemory> Memories = DeserializeMemories(ResponseContent);

    UE_LOG(LogTemp, Log, TEXT("AGLMemoryService: Retrieved %d memories"), Memories.Num());

    Callback.ExecuteIfBound(true, Memories);
}

FString UAGLMemoryService::MemoryTypeToString(EAGLMemoryType MemoryType)
{
    switch (MemoryType)
    {
        case EAGLMemoryType::Achievement: return TEXT("achievement");
        case EAGLMemoryType::Milestone: return TEXT("milestone");
        case EAGLMemoryType::FirstTime: return TEXT("first_time");
        case EAGLMemoryType::Dramatic: return TEXT("dramatic");
        case EAGLMemoryType::Conversation: return TEXT("conversation");
        case EAGLMemoryType::Event: return TEXT("event");
        case EAGLMemoryType::Observation: return TEXT("observation");
        default: return TEXT("event");
    }
}

EAGLMemoryType UAGLMemoryService::StringToMemoryType(const FString& TypeString)
{
    if (TypeString == TEXT("achievement")) return EAGLMemoryType::Achievement;
    if (TypeString == TEXT("milestone")) return EAGLMemoryType::Milestone;
    if (TypeString == TEXT("first_time")) return EAGLMemoryType::FirstTime;
    if (TypeString == TEXT("dramatic")) return EAGLMemoryType::Dramatic;
    if (TypeString == TEXT("conversation")) return EAGLMemoryType::Conversation;
    if (TypeString == TEXT("event")) return EAGLMemoryType::Event;
    if (TypeString == TEXT("observation")) return EAGLMemoryType::Observation;
    return EAGLMemoryType::Event;
}

FString UAGLMemoryService::SerializeCreateMemoryRequest(const FAGLCreateMemoryRequest& Request)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);

    JsonObject->SetStringField(TEXT("type"), MemoryTypeToString(Request.Type));
    JsonObject->SetStringField(TEXT("content"), Request.Content);
    JsonObject->SetNumberField(TEXT("importance"), Request.Importance);

    if (!Request.Emotion.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("emotion"), Request.Emotion);
    }

    // Add context object if not empty
    if (Request.Context.Num() > 0)
    {
        TSharedPtr<FJsonObject> ContextObject = MakeShareable(new FJsonObject);
        for (const auto& Pair : Request.Context)
        {
            ContextObject->SetStringField(Pair.Key, Pair.Value);
        }
        JsonObject->SetObjectField(TEXT("context"), ContextObject);
    }

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    return OutputString;
}

FString UAGLMemoryService::SerializeSearchRequest(const FAGLSearchMemoriesRequest& Request)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);

    JsonObject->SetStringField(TEXT("query"), Request.Query);
    JsonObject->SetNumberField(TEXT("limit"), Request.Limit);

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    return OutputString;
}

FString UAGLMemoryService::SerializeContextRequest(const FAGLGetContextRequest& Request)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);

    JsonObject->SetStringField(TEXT("currentEvent"), Request.CurrentEvent);
    JsonObject->SetNumberField(TEXT("limit"), Request.Limit);

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    return OutputString;
}

FAGLMemory UAGLMemoryService::DeserializeMemory(const TSharedPtr<FJsonObject>& JsonObject)
{
    FAGLMemory Memory;

    if (!JsonObject.IsValid())
    {
        return Memory;
    }

    JsonObject->TryGetStringField(TEXT("id"), Memory.Id);
    JsonObject->TryGetStringField(TEXT("playerId"), Memory.PlayerId);
    JsonObject->TryGetStringField(TEXT("content"), Memory.Content);
    JsonObject->TryGetStringField(TEXT("emotion"), Memory.Emotion);
    JsonObject->TryGetStringField(TEXT("createdAt"), Memory.CreatedAt);

    int32 Importance;
    if (JsonObject->TryGetNumberField(TEXT("importance"), Importance))
    {
        Memory.Importance = Importance;
    }

    FString TypeString;
    if (JsonObject->TryGetStringField(TEXT("type"), TypeString))
    {
        Memory.Type = StringToMemoryType(TypeString);
    }

    // Parse context object
    const TSharedPtr<FJsonObject>* ContextObject;
    if (JsonObject->TryGetObjectField(TEXT("context"), ContextObject) && ContextObject->IsValid())
    {
        for (const auto& Pair : (*ContextObject)->Values)
        {
            FString Value;
            if (Pair.Value->TryGetString(Value))
            {
                Memory.Context.Add(Pair.Key, Value);
            }
        }
    }

    return Memory;
}

TArray<FAGLMemorySearchResult> UAGLMemoryService::DeserializeSearchResults(const FString& JsonString)
{
    TArray<FAGLMemorySearchResult> Results;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to parse search results JSON"));
        return Results;
    }

    const TArray<TSharedPtr<FJsonValue>>* ResultsArray;
    if (JsonObject->TryGetArrayField(TEXT("results"), ResultsArray))
    {
        for (const TSharedPtr<FJsonValue>& ResultValue : *ResultsArray)
        {
            const TSharedPtr<FJsonObject>* ResultObject;
            if (ResultValue->TryGetObject(ResultObject) && ResultObject->IsValid())
            {
                FAGLMemorySearchResult SearchResult;

                // Parse similarity score
                (*ResultObject)->TryGetNumberField(TEXT("similarityScore"), SearchResult.SimilarityScore);

                // Parse memory object
                const TSharedPtr<FJsonObject>* MemoryObject;
                if ((*ResultObject)->TryGetObjectField(TEXT("memory"), MemoryObject))
                {
                    SearchResult.Memory = DeserializeMemory(*MemoryObject);
                }

                Results.Add(SearchResult);
            }
        }
    }

    return Results;
}

TArray<FAGLMemory> UAGLMemoryService::DeserializeMemories(const FString& JsonString)
{
    TArray<FAGLMemory> Memories;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to parse memories JSON"));
        return Memories;
    }

    const TArray<TSharedPtr<FJsonValue>>* MemoriesArray;
    if (JsonObject->TryGetArrayField(TEXT("memories"), MemoriesArray))
    {
        for (const TSharedPtr<FJsonValue>& MemoryValue : *MemoriesArray)
        {
            const TSharedPtr<FJsonObject>* MemoryObject;
            if (MemoryValue->TryGetObject(MemoryObject))
            {
                FAGLMemory Memory = DeserializeMemory(*MemoryObject);
                Memories.Add(Memory);
            }
        }
    }

    return Memories;
}
