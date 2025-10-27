// Copyright AGL Team. All Rights Reserved.

#include "AGLEmotionService.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"
#include "JsonUtilities.h"

void UAGLEmotionService::Initialize(const FString& InServiceUrl, const FString& InApiKey, float InTimeout)
{
    ServiceUrl = InServiceUrl;
    ApiKey = InApiKey;
    Timeout = InTimeout;

    UE_LOG(LogTemp, Log, TEXT("AGLEmotionService initialized with URL: %s"), *ServiceUrl);
}

void UAGLEmotionService::AnalyzeEmotion(const FAGLEmotionRequest& Request, FOnEmotionAnalysisComplete OnComplete)
{
    // Create HTTP request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();

    HttpRequest->SetURL(ServiceUrl + TEXT("/analyze"));
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
            HandleEmotionResponse(Request, Response, bWasSuccessful, OnComplete);
        }
    );

    // Send request
    HttpRequest->ProcessRequest();

    UE_LOG(LogTemp, Log, TEXT("AGLEmotionService: Sent emotion analysis request"));
}

FAGLEmotionRequest UAGLEmotionService::CreateVictoryRequest(bool bIsMVP, int32 WinStreak)
{
    FAGLEmotionRequest Request;
    Request.EventType = EAGLEventType::Victory;
    Request.Data.Add(TEXT("mvp"), bIsMVP ? TEXT("true") : TEXT("false"));
    Request.Data.Add(TEXT("winStreak"), FString::FromInt(WinStreak));
    return Request;
}

FAGLEmotionRequest UAGLEmotionService::CreateDefeatRequest(int32 LossStreak)
{
    FAGLEmotionRequest Request;
    Request.EventType = EAGLEventType::Defeat;
    Request.Data.Add(TEXT("lossStreak"), FString::FromInt(LossStreak));
    return Request;
}

FAGLEmotionRequest UAGLEmotionService::CreateAchievementRequest(const FString& Rarity)
{
    FAGLEmotionRequest Request;
    Request.EventType = EAGLEventType::Achievement;
    Request.Data.Add(TEXT("rarity"), Rarity);
    return Request;
}

FAGLEmotionRequest UAGLEmotionService::CreateKillRequest(int32 KillCount, bool bIsLegendary)
{
    FAGLEmotionRequest Request;
    Request.EventType = EAGLEventType::Kill;
    Request.Data.Add(TEXT("killCount"), FString::FromInt(KillCount));
    Request.Data.Add(TEXT("isLegendary"), bIsLegendary ? TEXT("true") : TEXT("false"));
    return Request;
}

void UAGLEmotionService::HandleEmotionResponse(
    FHttpRequestPtr Request,
    FHttpResponsePtr Response,
    bool bWasSuccessful,
    FOnEmotionAnalysisComplete Callback)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("AGLEmotionService: Request failed"));
        FAGLEmotionResponse EmptyResponse;
        Callback.ExecuteIfBound(false, EmptyResponse);
        return;
    }

    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Error, TEXT("AGLEmotionService: Server returned error %d"), Response->GetResponseCode());
        FAGLEmotionResponse EmptyResponse;
        Callback.ExecuteIfBound(false, EmptyResponse);
        return;
    }

    // Parse response
    FString ResponseContent = Response->GetContentAsString();
    FAGLEmotionResponse EmotionResponse = DeserializeResponse(ResponseContent);

    UE_LOG(LogTemp, Log, TEXT("AGLEmotionService: Received emotion %s with intensity %.2f"),
        *UEnum::GetValueAsString(EmotionResponse.Emotion),
        EmotionResponse.Intensity);

    Callback.ExecuteIfBound(true, EmotionResponse);
}

FString UAGLEmotionService::EventTypeToString(EAGLEventType EventType)
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

EAGLEmotionType UAGLEmotionService::StringToEmotionType(const FString& EmotionString)
{
    if (EmotionString == TEXT("happy")) return EAGLEmotionType::Happy;
    if (EmotionString == TEXT("excited")) return EAGLEmotionType::Excited;
    if (EmotionString == TEXT("amazed")) return EAGLEmotionType::Amazed;
    if (EmotionString == TEXT("proud")) return EAGLEmotionType::Proud;
    if (EmotionString == TEXT("satisfied")) return EAGLEmotionType::Satisfied;
    if (EmotionString == TEXT("cheerful")) return EAGLEmotionType::Cheerful;
    if (EmotionString == TEXT("grateful")) return EAGLEmotionType::Grateful;
    if (EmotionString == TEXT("sad")) return EAGLEmotionType::Sad;
    if (EmotionString == TEXT("disappointed")) return EAGLEmotionType::Disappointed;
    if (EmotionString == TEXT("frustrated")) return EAGLEmotionType::Frustrated;
    if (EmotionString == TEXT("angry")) return EAGLEmotionType::Angry;
    if (EmotionString == TEXT("worried")) return EAGLEmotionType::Worried;
    if (EmotionString == TEXT("tired")) return EAGLEmotionType::Tired;
    return EAGLEmotionType::Neutral;
}

FString UAGLEmotionService::SerializeRequest(const FAGLEmotionRequest& Request)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);

    JsonObject->SetStringField(TEXT("type"), EventTypeToString(Request.EventType));
    JsonObject->SetBoolField(TEXT("force_ml"), Request.bForceML);

    // Add data object
    TSharedPtr<FJsonObject> DataObject = MakeShareable(new FJsonObject);
    for (const auto& Pair : Request.Data)
    {
        DataObject->SetStringField(Pair.Key, Pair.Value);
    }
    JsonObject->SetObjectField(TEXT("data"), DataObject);

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

FAGLEmotionResponse UAGLEmotionService::DeserializeResponse(const FString& JsonString)
{
    FAGLEmotionResponse Response;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("Failed to parse emotion response JSON"));
        return Response;
    }

    FString EmotionString;
    if (JsonObject->TryGetStringField(TEXT("emotion"), EmotionString))
    {
        Response.Emotion = StringToEmotionType(EmotionString);
    }

    JsonObject->TryGetNumberField(TEXT("intensity"), Response.Intensity);
    JsonObject->TryGetNumberField(TEXT("confidence"), Response.Confidence);
    JsonObject->TryGetNumberField(TEXT("cost"), Response.Cost);
    JsonObject->TryGetNumberField(TEXT("latency_ms"), Response.LatencyMs);
    JsonObject->TryGetStringField(TEXT("action"), Response.Action);
    JsonObject->TryGetStringField(TEXT("reasoning"), Response.Reasoning);
    JsonObject->TryGetStringField(TEXT("method"), Response.Method);
    JsonObject->TryGetBoolField(TEXT("cache_hit"), Response.bCacheHit);

    return Response;
}
