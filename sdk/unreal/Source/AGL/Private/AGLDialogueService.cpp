// Copyright AGL Team. All Rights Reserved.

#include "AGLDialogueService.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"
#include "JsonUtilities.h"

void UAGLDialogueService::Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout)
{
    ServiceUrl = InServiceUrl;
    ApiKey = InApiKey;
    Timeout = InTimeout;

    UE_LOG(LogTemp, Log, TEXT("AGLDialogueService initialized with URL: %s"), *ServiceUrl);
}

void UAGLDialogueService::GenerateDialogue(const FAGLDialogueRequest& Request, FOnDialogueGenerationComplete OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    HttpRequest->SetURL(ServiceUrl + TEXT("/generate"));
    HttpRequest->SetVerb(TEXT("POST"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetHeader(TEXT("X-API-Key"), ApiKey);
    HttpRequest->SetTimeout(Timeout);

    // Serialize request to JSON
    FString JsonPayload = SerializeRequest(Request);
    HttpRequest->SetContentAsString(JsonPayload);

    // Bind response handler
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this, OnComplete](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            HandleDialogueResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLDialogueService: Sent dialogue generation request"));
}

void UAGLDialogueService::HandleDialogueResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bWasSuccessful,
    FOnDialogueGenerationComplete Callback)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLDialogueService: Request failed"));
        FAGLDialogueResponse EmptyResponse;
        Callback.ExecuteIfBound(false, EmptyResponse);
        return;
    }

    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Error, TEXT("AGLDialogueService: Server returned error %d"), Response->GetResponseCode());
        FAGLDialogueResponse EmptyResponse;
        Callback.ExecuteIfBound(false, EmptyResponse);
        return;
    }

    // Parse response
    FString ResponseContent = Response->GetContentAsString();
    FAGLDialogueResponse DialogueResponse = DeserializeResponse(ResponseContent);

    UE_LOG(LogTemp, Log, TEXT("AGLDialogueService: Received dialogue: %s (Method: %s)"),
        *DialogueResponse.Dialogue,
        *DialogueResponse.Method);

    Callback.ExecuteIfBound(true, DialogueResponse);
}

FString UAGLDialogueService::EventTypeToString(EAGLEventType EventType)
{
    switch (EventType)
    {
        case EAGLEventType::Victory: return TEXT("player.victory");
        case EAGLEventType::Defeat: return TEXT("player.defeat");
        case EAGLEventType::Kill: return TEXT("player.kill");
        case EAGLEventType::Death: return TEXT("player.death");
        case EAGLEventType::Achievement: return TEXT("player.achievement");
        case EAGLEventType::LevelUp: return TEXT("player.levelup");
        case EAGLEventType::Loot: return TEXT("player.loot");
        case EAGLEventType::SessionStart: return TEXT("player.sessionstart");
        case EAGLEventType::SessionEnd: return TEXT("player.sessionend");
        default: return TEXT("unknown");
    }
}

FString UAGLDialogueService::EmotionTypeToString(EAGLEmotionType EmotionType)
{
    switch (EmotionType)
    {
        case EAGLEmotionType::Happy: return TEXT("happy");
        case EAGLEmotionType::Excited: return TEXT("excited");
        case EAGLEmotionType::Amazed: return TEXT("amazed");
        case EAGLEmotionType::Proud: return TEXT("proud");
        case EAGLEmotionType::Satisfied: return TEXT("satisfied");
        case EAGLEmotionType::Cheerful: return TEXT("cheerful");
        case EAGLEmotionType::Grateful: return TEXT("grateful");
        case EAGLEmotionType::Sad: return TEXT("sad");
        case EAGLEmotionType::Disappointed: return TEXT("disappointed");
        case EAGLEmotionType::Frustrated: return TEXT("frustrated");
        case EAGLEmotionType::Angry: return TEXT("angry");
        case EAGLEmotionType::Worried: return TEXT("worried");
        case EAGLEmotionType::Tired: return TEXT("tired");
        case EAGLEmotionType::Neutral: return TEXT("neutral");
        default: return TEXT("neutral");
    }
}

FString UAGLDialogueService::PersonaToString(EAGLPersona Persona)
{
    switch (Persona)
    {
        case EAGLPersona::Cheerful: return TEXT("cheerful");
        case EAGLPersona::Cool: return TEXT("cool");
        case EAGLPersona::Cute: return TEXT("cute");
        default: return TEXT("cheerful");
    }
}

FString UAGLDialogueService::SerializeRequest(const FAGLDialogueRequest& Request)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);

    JsonObject->SetStringField(TEXT("event_type"), EventTypeToString(Request.EventType));
    JsonObject->SetStringField(TEXT("emotion"), EmotionTypeToString(Request.Emotion));
    JsonObject->SetStringField(TEXT("persona"), PersonaToString(Request.Persona));
    JsonObject->SetBoolField(TEXT("force_llm"), Request.bForceLLM);

    // Add optional player_id
    if (!Request.PlayerId.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("player_id"), Request.PlayerId);
    }

    // Add language field
    if (!Request.Language.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("language"), Request.Language);
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

FAGLDialogueResponse UAGLDialogueService::DeserializeResponse(const FString& JsonString)
{
    FAGLDialogueResponse Response;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to parse dialogue response JSON"));
        return Response;
    }

    JsonObject->TryGetStringField(TEXT("dialogue"), Response.Dialogue);
    JsonObject->TryGetStringField(TEXT("method"), Response.Method);
    JsonObject->TryGetNumberField(TEXT("cost"), Response.Cost);
    JsonObject->TryGetNumberField(TEXT("latency_ms"), Response.LatencyMs);
    JsonObject->TryGetBoolField(TEXT("used_special_case"), Response.bUsedSpecialCase);
    JsonObject->TryGetBoolField(TEXT("cache_hit"), Response.bCacheHit);

    // Parse memory_count
    int32 MemoryCount;
    if (JsonObject->TryGetNumberField(TEXT("memory_count"), MemoryCount))
    {
        Response.MemoryCount = MemoryCount;
    }

    // Parse special_case_reasons array
    const TArray<TSharedPtr<FJsonValue>>* ReasonsArray;
    if (JsonObject->TryGetArrayField(TEXT("special_case_reasons"), ReasonsArray))
    {
        for (const TSharedPtr<FJsonValue>& ReasonValue : *ReasonsArray)
        {
            FString Reason;
            if (ReasonValue->TryGetString(Reason))
            {
                Response.SpecialCaseReasons.Add(Reason);
            }
        }
    }

    return Response;
}
