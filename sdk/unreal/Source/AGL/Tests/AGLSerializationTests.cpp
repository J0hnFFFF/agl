// Copyright AGL Team. All Rights Reserved.

#include "AGLSerializationTests.h"
#include "AGLTypes.h"
#include "AGLDialogueService.h"
#include "AGLEmotionService.h"
#include "AGLMemoryService.h"
#include "Json.h"
#include "JsonUtilities.h"

// Unreal Automation Framework
#if WITH_DEV_AUTOMATION_TESTS

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLEnumConversionTest, "AGL.Serialization.EnumConversion",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLEnumConversionTest::RunTest(const FString& Parameters)
{
    // Test EventType conversions
    {
        UAGLDialogueService* TempService = NewObject<UAGLDialogueService>();

        TestEqual("Victory EventType", TempService->EventTypeToString(EAGLEventType::Victory), TEXT("player.victory"));
        TestEqual("Defeat EventType", TempService->EventTypeToString(EAGLEventType::Defeat), TEXT("player.defeat"));
        TestEqual("Kill EventType", TempService->EventTypeToString(EAGLEventType::Kill), TEXT("player.kill"));
        TestEqual("Death EventType", TempService->EventTypeToString(EAGLEventType::Death), TEXT("player.death"));
        TestEqual("Achievement EventType", TempService->EventTypeToString(EAGLEventType::Achievement), TEXT("player.achievement"));
        TestEqual("LevelUp EventType", TempService->EventTypeToString(EAGLEventType::LevelUp), TEXT("player.levelup"));
        TestEqual("Loot EventType", TempService->EventTypeToString(EAGLEventType::Loot), TEXT("player.loot"));
        TestEqual("SessionStart EventType", TempService->EventTypeToString(EAGLEventType::SessionStart), TEXT("player.sessionstart"));
        TestEqual("SessionEnd EventType", TempService->EventTypeToString(EAGLEventType::SessionEnd), TEXT("player.sessionend"));
    }

    // Test EmotionType conversions
    {
        UAGLDialogueService* TempService = NewObject<UAGLDialogueService>();

        TestEqual("Happy EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Happy), TEXT("happy"));
        TestEqual("Excited EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Excited), TEXT("excited"));
        TestEqual("Amazed EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Amazed), TEXT("amazed"));
        TestEqual("Proud EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Proud), TEXT("proud"));
        TestEqual("Satisfied EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Satisfied), TEXT("satisfied"));
        TestEqual("Cheerful EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Cheerful), TEXT("cheerful"));
        TestEqual("Grateful EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Grateful), TEXT("grateful"));
        TestEqual("Sad EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Sad), TEXT("sad"));
        TestEqual("Disappointed EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Disappointed), TEXT("disappointed"));
        TestEqual("Frustrated EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Frustrated), TEXT("frustrated"));
        TestEqual("Angry EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Angry), TEXT("angry"));
        TestEqual("Worried EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Worried), TEXT("worried"));
        TestEqual("Tired EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Tired), TEXT("tired"));
        TestEqual("Neutral EmotionType", TempService->EmotionTypeToString(EAGLEmotionType::Neutral), TEXT("neutral"));
    }

    // Test Persona conversions
    {
        UAGLDialogueService* TempService = NewObject<UAGLDialogueService>();

        TestEqual("Cheerful Persona", TempService->PersonaToString(EAGLPersona::Cheerful), TEXT("cheerful"));
        TestEqual("Cool Persona", TempService->PersonaToString(EAGLPersona::Cool), TEXT("cool"));
        TestEqual("Cute Persona", TempService->PersonaToString(EAGLPersona::Cute), TEXT("cute"));
    }

    // Test MemoryType conversions
    {
        UAGLMemoryService* TempService = NewObject<UAGLMemoryService>();

        TestEqual("Achievement MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Achievement), TEXT("achievement"));
        TestEqual("Milestone MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Milestone), TEXT("milestone"));
        TestEqual("FirstTime MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::FirstTime), TEXT("first_time"));
        TestEqual("Dramatic MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Dramatic), TEXT("dramatic"));
        TestEqual("Conversation MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Conversation), TEXT("conversation"));
        TestEqual("Event MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Event), TEXT("event"));
        TestEqual("Observation MemoryType", TempService->MemoryTypeToString(EAGLMemoryType::Observation), TEXT("observation"));
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLDialogueRequestSerializationTest, "AGL.Serialization.DialogueRequest",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLDialogueRequestSerializationTest::RunTest(const FString& Parameters)
{
    UAGLDialogueService* Service = NewObject<UAGLDialogueService>();

    // Test basic dialogue request
    {
        FAGLDialogueRequest Request;
        Request.EventType = EAGLEventType::Victory;
        Request.Emotion = EAGLEmotionType::Happy;
        Request.Persona = EAGLPersona::Cheerful;
        Request.Language = TEXT("en");
        Request.bForceLLM = false;

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains event_type", Json.Contains(TEXT("\"event_type\":\"player.victory\"")));
        TestTrue("JSON contains emotion", Json.Contains(TEXT("\"emotion\":\"happy\"")));
        TestTrue("JSON contains persona", Json.Contains(TEXT("\"persona\":\"cheerful\"")));
        TestTrue("JSON contains language", Json.Contains(TEXT("\"language\":\"en\"")));
        TestTrue("JSON contains force_llm", Json.Contains(TEXT("\"force_llm\":false")));
    }

    // Test with player_id
    {
        FAGLDialogueRequest Request;
        Request.EventType = EAGLEventType::Achievement;
        Request.Emotion = EAGLEmotionType::Proud;
        Request.Persona = EAGLPersona::Cool;
        Request.PlayerId = TEXT("player-123");
        Request.Language = TEXT("zh");

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains player_id", Json.Contains(TEXT("\"player_id\":\"player-123\"")));
        TestTrue("JSON contains language zh", Json.Contains(TEXT("\"language\":\"zh\"")));
    }

    // Test with context
    {
        FAGLDialogueRequest Request;
        Request.EventType = EAGLEventType::Kill;
        Request.Emotion = EAGLEmotionType::Excited;
        Request.Persona = EAGLPersona::Cute;
        Request.Context.Add(TEXT("enemy_type"), TEXT("dragon"));
        Request.Context.Add(TEXT("win_streak"), TEXT("5"));

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains context", Json.Contains(TEXT("\"context\"")));
        TestTrue("JSON contains enemy_type", Json.Contains(TEXT("\"enemy_type\":\"dragon\"")));
        TestTrue("JSON contains win_streak", Json.Contains(TEXT("\"win_streak\":\"5\"")));
    }

    // Test multi-language support
    {
        TArray<FString> Languages = {TEXT("zh"), TEXT("en"), TEXT("ja")};

        for (const FString& Lang : Languages)
        {
            FAGLDialogueRequest Request;
            Request.EventType = EAGLEventType::Victory;
            Request.Emotion = EAGLEmotionType::Happy;
            Request.Persona = EAGLPersona::Cheerful;
            Request.Language = Lang;

            FString Json = Service->SerializeRequest(Request);
            FString ExpectedLang = FString::Printf(TEXT("\"language\":\"%s\""), *Lang);

            TestTrue(FString::Printf(TEXT("JSON contains language %s"), *Lang), Json.Contains(ExpectedLang));
        }
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLDialogueResponseDeserializationTest, "AGL.Serialization.DialogueResponse",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLDialogueResponseDeserializationTest::RunTest(const FString& Parameters)
{
    UAGLDialogueService* Service = NewObject<UAGLDialogueService>();

    // Test basic response
    {
        FString JsonResponse = TEXT("{\"dialogue\":\"Great job!\",\"method\":\"template\",\"cost\":0.0,\"latency_ms\":15,\"used_special_case\":false,\"cache_hit\":false,\"memory_count\":0,\"special_case_reasons\":[]}");

        FAGLDialogueResponse Response = Service->DeserializeResponse(JsonResponse);

        TestEqual("Dialogue text", Response.Dialogue, TEXT("Great job!"));
        TestEqual("Method", Response.Method, TEXT("template"));
        TestEqual("Cost", Response.Cost, 0.0f);
        TestEqual("Latency", Response.LatencyMs, 15);
        TestEqual("Used special case", Response.bUsedSpecialCase, false);
        TestEqual("Cache hit", Response.bCacheHit, false);
        TestEqual("Memory count", Response.MemoryCount, 0);
    }

    // Test LLM response with cost
    {
        FString JsonResponse = TEXT("{\"dialogue\":\"Amazing victory!\",\"method\":\"llm\",\"cost\":0.002,\"latency_ms\":450,\"used_special_case\":true,\"cache_hit\":false,\"memory_count\":3,\"special_case_reasons\":[\"win_streak\",\"legendary\"]}");

        FAGLDialogueResponse Response = Service->DeserializeResponse(JsonResponse);

        TestEqual("Dialogue text", Response.Dialogue, TEXT("Amazing victory!"));
        TestEqual("Method", Response.Method, TEXT("llm"));
        TestTrue("Cost > 0", Response.Cost > 0.0f);
        TestEqual("Used special case", Response.bUsedSpecialCase, true);
        TestEqual("Memory count", Response.MemoryCount, 3);
        TestEqual("Special case reasons count", Response.SpecialCaseReasons.Num(), 2);

        if (Response.SpecialCaseReasons.Num() == 2)
        {
            TestEqual("First reason", Response.SpecialCaseReasons[0], TEXT("win_streak"));
            TestEqual("Second reason", Response.SpecialCaseReasons[1], TEXT("legendary"));
        }
    }

    // Test cached response
    {
        FString JsonResponse = TEXT("{\"dialogue\":\"You did it!\",\"method\":\"cached\",\"cost\":0.0,\"latency_ms\":5,\"used_special_case\":false,\"cache_hit\":true,\"memory_count\":0,\"special_case_reasons\":[]}");

        FAGLDialogueResponse Response = Service->DeserializeResponse(JsonResponse);

        TestEqual("Method", Response.Method, TEXT("cached"));
        TestEqual("Cache hit", Response.bCacheHit, true);
        TestTrue("Latency < 10ms", Response.LatencyMs < 10);
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLEmotionRequestSerializationTest, "AGL.Serialization.EmotionRequest",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLEmotionRequestSerializationTest::RunTest(const FString& Parameters)
{
    UAGLEmotionService* Service = NewObject<UAGLEmotionService>();

    // Test basic emotion request
    {
        FAGLEmotionRequest Request;
        Request.EventType = EAGLEventType::Victory;
        Request.bForceML = false;

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains event type", Json.Contains(TEXT("\"type\":\"player.victory\"")));
        TestTrue("JSON contains force_ml", Json.Contains(TEXT("\"force_ml\":false")));
    }

    // Test with data
    {
        FAGLEmotionRequest Request;
        Request.EventType = EAGLEventType::Kill;
        Request.Data.Add(TEXT("kill_count"), TEXT("5"));
        Request.Data.Add(TEXT("is_legendary"), TEXT("true"));

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains data", Json.Contains(TEXT("\"data\"")));
        TestTrue("JSON contains kill_count", Json.Contains(TEXT("\"kill_count\":\"5\"")));
        TestTrue("JSON contains is_legendary", Json.Contains(TEXT("\"is_legendary\":\"true\"")));
    }

    // Test with context
    {
        FAGLEmotionRequest Request;
        Request.EventType = EAGLEventType::Achievement;
        Request.Context.Add(TEXT("player_health"), TEXT("85.5"));
        Request.Context.Add(TEXT("in_combat"), TEXT("false"));

        FString Json = Service->SerializeRequest(Request);

        TestTrue("JSON contains context", Json.Contains(TEXT("\"context\"")));
        TestTrue("JSON contains player_health", Json.Contains(TEXT("\"player_health\":\"85.5\"")));
        TestTrue("JSON contains in_combat", Json.Contains(TEXT("\"in_combat\":\"false\"")));
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLEmotionResponseDeserializationTest, "AGL.Serialization.EmotionResponse",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLEmotionResponseDeserializationTest::RunTest(const FString& Parameters)
{
    UAGLEmotionService* Service = NewObject<UAGLEmotionService>();

    // Test basic response
    {
        FString JsonResponse = TEXT("{\"emotion\":\"happy\",\"intensity\":0.8,\"action\":\"celebrate\",\"confidence\":0.95,\"reasoning\":\"Victory detected\",\"method\":\"rule\",\"cost\":0.0,\"cache_hit\":false,\"latency_ms\":5}");

        FAGLEmotionResponse Response = Service->DeserializeResponse(JsonResponse);

        TestEqual("Emotion type", Response.Emotion, EAGLEmotionType::Happy);
        TestEqual("Intensity", Response.Intensity, 0.8f);
        TestEqual("Action", Response.Action, TEXT("celebrate"));
        TestEqual("Confidence", Response.Confidence, 0.95f);
        TestEqual("Reasoning", Response.Reasoning, TEXT("Victory detected"));
        TestEqual("Method", Response.Method, TEXT("rule"));
        TestEqual("Cost", Response.Cost, 0.0f);
        TestEqual("Cache hit", Response.bCacheHit, false);
        TestEqual("Latency", Response.LatencyMs, 5);
    }

    // Test ML response with cost
    {
        FString JsonResponse = TEXT("{\"emotion\":\"excited\",\"intensity\":0.9,\"action\":\"cheer\",\"confidence\":0.88,\"reasoning\":\"Legendary kill streak\",\"method\":\"ml\",\"cost\":0.001,\"cache_hit\":false,\"latency_ms\":380}");

        FAGLEmotionResponse Response = Service->DeserializeResponse(JsonResponse);

        TestEqual("Emotion type", Response.Emotion, EAGLEmotionType::Excited);
        TestEqual("Method", Response.Method, TEXT("ml"));
        TestTrue("Cost > 0", Response.Cost > 0.0f);
        TestTrue("Latency > 100ms", Response.LatencyMs > 100);
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLMemorySerializationTest, "AGL.Serialization.Memory",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLMemorySerializationTest::RunTest(const FString& Parameters)
{
    UAGLMemoryService* Service = NewObject<UAGLMemoryService>();

    // Test memory creation request serialization
    {
        FAGLCreateMemoryRequest Request;
        Request.Type = EAGLMemoryType::Achievement;
        Request.Content = TEXT("Defeated the dragon boss");
        Request.Emotion = TEXT("proud");
        Request.Importance = 8;
        Request.Context.Add(TEXT("boss_name"), TEXT("Ancient Dragon"));
        Request.Context.Add(TEXT("attempts"), TEXT("3"));

        FString Json = Service->SerializeCreateMemoryRequest(Request);

        TestTrue("JSON contains type", Json.Contains(TEXT("\"type\":\"achievement\"")));
        TestTrue("JSON contains content", Json.Contains(TEXT("\"content\":\"Defeated the dragon boss\"")));
        TestTrue("JSON contains emotion", Json.Contains(TEXT("\"emotion\":\"proud\"")));
        TestTrue("JSON contains importance", Json.Contains(TEXT("\"importance\":8")));
        TestTrue("JSON contains context", Json.Contains(TEXT("\"context\"")));
    }

    // Test memory deserialization
    {
        FString JsonMemory = TEXT("{\"id\":\"mem_123\",\"playerId\":\"player_456\",\"type\":\"achievement\",\"content\":\"First legendary item\",\"emotion\":\"amazed\",\"importance\":9,\"context\":{\"item_name\":\"Excalibur\"},\"createdAt\":\"2025-01-26T10:00:00Z\"}");

        // Parse JSON string to JsonObject
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonMemory);

        if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
        {
            FAGLMemory Memory = Service->DeserializeMemory(JsonObject);

            TestEqual("Memory ID", Memory.Id, TEXT("mem_123"));
            TestEqual("Player ID", Memory.PlayerId, TEXT("player_456"));
            TestEqual("Type", Memory.Type, EAGLMemoryType::Achievement);
            TestEqual("Content", Memory.Content, TEXT("First legendary item"));
            TestEqual("Emotion", Memory.Emotion, TEXT("amazed"));
            TestEqual("Importance", Memory.Importance, 9);
            TestEqual("Context count", Memory.Context.Num(), 1);
            TestEqual("Created at", Memory.CreatedAt, TEXT("2025-01-26T10:00:00Z"));
        }
        else
        {
            AddError(TEXT("Failed to parse memory JSON"));
        }
    }

    // Test search request serialization
    {
        FAGLSearchMemoriesRequest Request;
        Request.Query = TEXT("dragon battles");
        Request.Limit = 10;

        FString Json = Service->SerializeSearchRequest(Request);

        TestTrue("JSON contains query", Json.Contains(TEXT("\"query\":\"dragon battles\"")));
        TestTrue("JSON contains limit", Json.Contains(TEXT("\"limit\":10")));
    }

    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FAGLEdgeCasesTest, "AGL.Serialization.EdgeCases",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FAGLEdgeCasesTest::RunTest(const FString& Parameters)
{
    // Test empty strings
    {
        UAGLDialogueService* Service = NewObject<UAGLDialogueService>();

        FAGLDialogueRequest Request;
        Request.EventType = EAGLEventType::Victory;
        Request.Emotion = EAGLEmotionType::Happy;
        Request.Persona = EAGLPersona::Cheerful;
        Request.PlayerId = TEXT("");  // Empty player ID
        Request.Language = TEXT("en");

        FString Json = Service->SerializeRequest(Request);

        // Empty player_id should not be included
        TestFalse("Empty player_id not included", Json.Contains(TEXT("\"player_id\":\"\"")));
    }

    // Test special characters
    {
        UAGLMemoryService* Service = NewObject<UAGLMemoryService>();

        FAGLCreateMemoryRequest Request;
        Request.Type = EAGLMemoryType::Conversation;
        Request.Content = TEXT("NPC said: \"Hello, adventurer!\"");
        Request.Emotion = TEXT("cheerful");

        FString Json = Service->SerializeCreateMemoryRequest(Request);

        TestTrue("JSON created", !Json.IsEmpty());
        // Verify it's valid JSON by parsing
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
        TestTrue("JSON is valid", FJsonSerializer::Deserialize(Reader, JsonObject));
    }

    // Test Unicode content
    {
        UAGLMemoryService* Service = NewObject<UAGLMemoryService>();

        FAGLCreateMemoryRequest Request;
        Request.Type = EAGLMemoryType::Event;
        Request.Content = TEXT("击败了传奇BOSS");  // Chinese characters
        Request.Emotion = TEXT("excited");

        FString Json = Service->SerializeCreateMemoryRequest(Request);

        TestTrue("JSON created", !Json.IsEmpty());
        TestTrue("Contains Unicode content", Json.Contains(TEXT("击败了传奇BOSS")));
    }

    // Test maximum values
    {
        FAGLCreateMemoryRequest Request;
        Request.Importance = 10;  // Maximum importance

        TestEqual("Max importance", Request.Importance, 10);
    }

    // Test minimum values
    {
        FAGLEmotionResponse Response;
        Response.Intensity = 0.0f;
        Response.Confidence = 0.0f;
        Response.Cost = 0.0f;

        TestEqual("Min intensity", Response.Intensity, 0.0f);
        TestEqual("Min confidence", Response.Confidence, 0.0f);
        TestEqual("Min cost", Response.Cost, 0.0f);
    }

    return true;
}

#endif // WITH_DEV_AUTOMATION_TESTS
