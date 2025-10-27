// Copyright AGL Team. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Misc/AutomationTest.h"

/**
 * Automation tests for AGL type serialization
 *
 * These tests verify that all AGL types can be correctly serialized to JSON
 * and deserialized back to C++ objects for HTTP API communication.
 *
 * Test Coverage:
 * - Enum to string conversion (EventType, EmotionType, Persona, MemoryType)
 * - Dialogue request/response serialization
 * - Emotion request/response serialization
 * - Memory request/response serialization
 * - Edge cases and special values
 */
class FAGLSerializationTests
{
public:
    /**
     * Test all enum to string conversions
     */
    static bool TestEnumConversions();

    /**
     * Test DialogueRequest serialization
     */
    static bool TestDialogueRequestSerialization();

    /**
     * Test DialogueResponse deserialization
     */
    static bool TestDialogueResponseDeserialization();

    /**
     * Test EmotionRequest serialization
     */
    static bool TestEmotionRequestSerialization();

    /**
     * Test EmotionResponse deserialization
     */
    static bool TestEmotionResponseDeserialization();

    /**
     * Test MemoryRequest serialization
     */
    static bool TestMemoryRequestSerialization();

    /**
     * Test Memory deserialization
     */
    static bool TestMemoryDeserialization();

    /**
     * Test edge cases (empty strings, special characters, etc.)
     */
    static bool TestEdgeCases();

    /**
     * Run all serialization tests
     * Returns true if all tests pass
     */
    static bool RunAllTests();
};
