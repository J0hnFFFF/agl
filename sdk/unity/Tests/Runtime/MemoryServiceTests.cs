using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using AGL.SDK.Core;
using AGL.SDK.Models;
using AGL.SDK.Services;

namespace AGL.Tests
{
    /// <summary>
    /// Unit tests for MemoryService
    /// Tests memory creation, helper methods, and request validation
    /// </summary>
    public class MemoryServiceTests
    {
        private AGLConfig config;
        private MemoryService service;

        [SetUp]
        public void Setup()
        {
            // Create test configuration
            config = ScriptableObject.CreateInstance<AGLConfig>();
            config.ApiKey = "test-api-key";
            config.MemoryServiceUrl = "http://localhost:8002";
            config.RequestTimeout = 5f;
            config.EnableDebugLogs = false;

            // Initialize service
            service = new MemoryService(config);
        }

        [TearDown]
        public void TearDown()
        {
            if (config != null)
            {
                Object.DestroyImmediate(config);
            }
        }

        #region Constructor Tests

        [Test]
        public void Constructor_WithValidConfig_ShouldInitializeService()
        {
            // Assert
            Assert.IsNotNull(service);
        }

        [Test]
        public void Constructor_WithNullConfig_ShouldThrowException()
        {
            // Act & Assert
            Assert.Throws<System.NullReferenceException>(() =>
            {
                var invalidService = new MemoryService(null);
            });
        }

        #endregion

        #region CreateMemoryRequest Tests

        [Test]
        public void CreateMemoryRequest_WithAchievement_ShouldCreateRequest()
        {
            // Act
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Defeated the dragon");

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual("achievement", request.type);
            Assert.AreEqual("Defeated the dragon", request.content);
            Assert.IsNull(request.emotion);
            Assert.IsNotNull(request.context);
            Assert.AreEqual(0, request.context.Count);
        }

        [Test]
        public void CreateMemoryRequest_WithCombat_ShouldCreateRequest()
        {
            // Act
            var request = new CreateMemoryRequest(MemoryType.Combat, "Epic boss fight", "excited");

            // Assert
            Assert.AreEqual("combat", request.type);
            Assert.AreEqual("Epic boss fight", request.content);
            Assert.AreEqual("excited", request.emotion);
        }

        [Test]
        public void CreateMemoryRequest_WithSocial_ShouldCreateRequest()
        {
            // Act
            var request = new CreateMemoryRequest(MemoryType.Social, "Met a friendly NPC");

            // Assert
            Assert.AreEqual("social", request.type);
            Assert.AreEqual("Met a friendly NPC", request.content);
        }

        [Test]
        public void CreateMemoryRequest_WithExploration_ShouldCreateRequest()
        {
            // Act
            var request = new CreateMemoryRequest(MemoryType.Exploration, "Discovered hidden cave");

            // Assert
            Assert.AreEqual("exploration", request.type);
            Assert.AreEqual("Discovered hidden cave", request.content);
        }

        [Test]
        public void CreateMemoryRequest_WithCustom_ShouldCreateRequest()
        {
            // Act
            var request = new CreateMemoryRequest(MemoryType.Custom, "Custom game event");

            // Assert
            Assert.AreEqual("custom", request.type);
            Assert.AreEqual("Custom game event", request.content);
        }

        [Test]
        public void CreateMemoryRequest_AllMemoryTypes_ShouldWork()
        {
            // Act & Assert
            Assert.DoesNotThrow(() => new CreateMemoryRequest(MemoryType.Achievement, "test"));
            Assert.DoesNotThrow(() => new CreateMemoryRequest(MemoryType.Combat, "test"));
            Assert.DoesNotThrow(() => new CreateMemoryRequest(MemoryType.Social, "test"));
            Assert.DoesNotThrow(() => new CreateMemoryRequest(MemoryType.Exploration, "test"));
            Assert.DoesNotThrow(() => new CreateMemoryRequest(MemoryType.Custom, "test"));
        }

        #endregion

        #region Helper Methods - AddContext

        [Test]
        public void AddContext_WithValidKeyValue_ShouldAddToContext()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Test memory");

            // Act
            MemoryService.AddContext(request, "test_key", "test_value");

            // Assert
            Assert.IsTrue(request.context.ContainsKey("test_key"));
            Assert.AreEqual("test_value", request.context["test_key"]);
        }

        [Test]
        public void AddContext_WithMultipleKeys_ShouldAllBePresent()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Combat, "Battle won");

            // Act
            MemoryService.AddContext(request, "enemy_type", "dragon");
            MemoryService.AddContext(request, "damage_dealt", 1250);
            MemoryService.AddContext(request, "was_critical", true);

            // Assert
            Assert.AreEqual(3, request.context.Count);
            Assert.AreEqual("dragon", request.context["enemy_type"]);
            Assert.AreEqual(1250, request.context["damage_dealt"]);
            Assert.AreEqual(true, request.context["was_critical"]);
        }

        [Test]
        public void AddContext_WithNullValue_ShouldStillAdd()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Social, "Met NPC");

            // Act
            MemoryService.AddContext(request, "nullable_key", null);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("nullable_key"));
            Assert.IsNull(request.context["nullable_key"]);
        }

        [Test]
        public void AddContext_OverwriteExistingKey_ShouldUpdateValue()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Level up");
            MemoryService.AddContext(request, "level", 5);

            // Act
            MemoryService.AddContext(request, "level", 6);

            // Assert
            Assert.AreEqual(6, request.context["level"]);
            Assert.AreEqual(1, request.context.Count);
        }

        #endregion

        #region Helper Methods - SetImportance

        [Test]
        public void SetImportance_WithValidValue_ShouldSetImportance()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Epic victory");

            // Act
            MemoryService.SetImportance(request, 0.8f);

            // Assert
            Assert.AreEqual(0.8f, request.importance);
        }

        [Test]
        public void SetImportance_WithZero_ShouldSetToZero()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Combat, "Minor skirmish");

            // Act
            MemoryService.SetImportance(request, 0f);

            // Assert
            Assert.AreEqual(0f, request.importance);
        }

        [Test]
        public void SetImportance_WithOne_ShouldSetToOne()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Game completed");

            // Act
            MemoryService.SetImportance(request, 1f);

            // Assert
            Assert.AreEqual(1f, request.importance);
        }

        [Test]
        public void SetImportance_WithValueAboveOne_ShouldClampToOne()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Achievement, "Test");

            // Act
            MemoryService.SetImportance(request, 1.5f);

            // Assert
            Assert.AreEqual(1f, request.importance);
        }

        [Test]
        public void SetImportance_WithNegativeValue_ShouldClampToZero()
        {
            // Arrange
            var request = new CreateMemoryRequest(MemoryType.Combat, "Test");

            // Act
            MemoryService.SetImportance(request, -0.5f);

            // Assert
            Assert.AreEqual(0f, request.importance);
        }

        #endregion

        #region ContextRequest Tests

        [Test]
        public void ContextRequest_WithDefaults_ShouldUseDefaultLimit()
        {
            // Act
            var request = new ContextRequest("player.victory");

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual("player.victory", request.current_event);
            Assert.AreEqual(5, request.limit);
        }

        [Test]
        public void ContextRequest_WithCustomLimit_ShouldSetLimit()
        {
            // Act
            var request = new ContextRequest("player.achievement", 10);

            // Assert
            Assert.AreEqual("player.achievement", request.current_event);
            Assert.AreEqual(10, request.limit);
        }

        [Test]
        public void ContextRequest_WithVariousEvents_ShouldWork()
        {
            // Act & Assert
            Assert.DoesNotThrow(() => new ContextRequest("player.victory"));
            Assert.DoesNotThrow(() => new ContextRequest("player.defeat"));
            Assert.DoesNotThrow(() => new ContextRequest("player.kill"));
            Assert.DoesNotThrow(() => new ContextRequest("npc.interaction"));
        }

        #endregion

        #region SearchRequest Tests

        [Test]
        public void SearchRequest_WithDefaults_ShouldUseDefaultValues()
        {
            // Act
            var request = new SearchRequest("dragon battles");

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual("dragon battles", request.query);
            Assert.AreEqual(10, request.limit);
            Assert.AreEqual(0.7f, request.min_similarity);
        }

        [Test]
        public void SearchRequest_WithCustomLimit_ShouldSetLimit()
        {
            // Act
            var request = new SearchRequest("epic moments", 20);

            // Assert
            Assert.AreEqual("epic moments", request.query);
            Assert.AreEqual(20, request.limit);
            Assert.AreEqual(0.7f, request.min_similarity);
        }

        [Test]
        public void SearchRequest_WithCustomSimilarity_ShouldSetSimilarity()
        {
            // Act
            var request = new SearchRequest("legendary items", 15, 0.85f);

            // Assert
            Assert.AreEqual("legendary items", request.query);
            Assert.AreEqual(15, request.limit);
            Assert.AreEqual(0.85f, request.min_similarity);
        }

        [Test]
        public void SearchRequest_WithLowSimilarity_ShouldAccept()
        {
            // Act
            var request = new SearchRequest("any match", 5, 0.3f);

            // Assert
            Assert.AreEqual(0.3f, request.min_similarity);
        }

        [Test]
        public void SearchRequest_WithHighSimilarity_ShouldAccept()
        {
            // Act
            var request = new SearchRequest("exact match", 5, 0.95f);

            // Assert
            Assert.AreEqual(0.95f, request.min_similarity);
        }

        #endregion

        #region Memory Model Tests

        [Test]
        public void Memory_ToString_ShouldFormatCorrectly()
        {
            // Arrange
            var memory = new Memory
            {
                content = "Defeated the boss",
                type = "achievement",
                importance = 0.85f
            };

            // Act
            var result = memory.ToString();

            // Assert
            Assert.IsTrue(result.Contains("Defeated the boss"));
            Assert.IsTrue(result.Contains("achievement"));
            Assert.IsTrue(result.Contains("0.85"));
        }

        #endregion

        #region SearchResult Model Tests

        [Test]
        public void SearchResult_ToString_ShouldFormatCorrectly()
        {
            // Arrange
            var searchResult = new SearchResult
            {
                memory = new Memory
                {
                    content = "Epic battle",
                    type = "combat",
                    importance = 0.9f
                },
                similarity_score = 0.92f
            };

            // Act
            var result = searchResult.ToString();

            // Assert
            Assert.IsTrue(result.Contains("Epic battle"));
            Assert.IsTrue(result.Contains("0.92"));
        }

        #endregion

        #region Integration Readiness Tests

        [Test]
        public void AchievementMemory_WithFullContext_ShouldBeWellFormed()
        {
            // Act
            var request = new CreateMemoryRequest(
                MemoryType.Achievement,
                "Unlocked legendary weapon",
                "excited"
            );
            MemoryService.AddContext(request, "achievement_id", "legendary_sword_001");
            MemoryService.AddContext(request, "rarity", "legendary");
            MemoryService.AddContext(request, "first_time", true);
            MemoryService.SetImportance(request, 0.95f);

            // Assert
            Assert.AreEqual("achievement", request.type);
            Assert.AreEqual("Unlocked legendary weapon", request.content);
            Assert.AreEqual("excited", request.emotion);
            Assert.AreEqual(3, request.context.Count);
            Assert.AreEqual(0.95f, request.importance);
        }

        [Test]
        public void CombatMemory_WithBattleStats_ShouldBeWellFormed()
        {
            // Act
            var request = new CreateMemoryRequest(
                MemoryType.Combat,
                "Defeated dragon boss after intense 10-minute battle",
                "triumphant"
            );
            MemoryService.AddContext(request, "enemy_type", "dragon");
            MemoryService.AddContext(request, "enemy_level", 50);
            MemoryService.AddContext(request, "damage_dealt", 15000);
            MemoryService.AddContext(request, "health_remaining", 25.5f);
            MemoryService.SetImportance(request, 0.9f);

            // Assert
            Assert.AreEqual("combat", request.type);
            Assert.AreEqual(4, request.context.Count);
            Assert.AreEqual("dragon", request.context["enemy_type"]);
            Assert.AreEqual(50, request.context["enemy_level"]);
        }

        [Test]
        public void SocialMemory_WithNPCInteraction_ShouldBeWellFormed()
        {
            // Act
            var request = new CreateMemoryRequest(
                MemoryType.Social,
                "Had a heartfelt conversation with the village elder",
                "touched"
            );
            MemoryService.AddContext(request, "npc_id", "elder_001");
            MemoryService.AddContext(request, "npc_name", "Elder Theron");
            MemoryService.AddContext(request, "relationship_change", 15);
            MemoryService.SetImportance(request, 0.7f);

            // Assert
            Assert.AreEqual("social", request.type);
            Assert.AreEqual(3, request.context.Count);
            Assert.AreEqual(0.7f, request.importance);
        }

        [Test]
        public void ExplorationMemory_WithDiscovery_ShouldBeWellFormed()
        {
            // Act
            var request = new CreateMemoryRequest(
                MemoryType.Exploration,
                "Discovered ancient ruins in the northern mountains",
                "curious"
            );
            MemoryService.AddContext(request, "location", "Northern Mountains");
            MemoryService.AddContext(request, "coordinates", new { x = 1250, y = 3400 });
            MemoryService.AddContext(request, "first_discovery", true);
            MemoryService.SetImportance(request, 0.75f);

            // Assert
            Assert.AreEqual("exploration", request.type);
            Assert.AreEqual("curious", request.emotion);
            Assert.AreEqual(3, request.context.Count);
        }

        [Test]
        public void ContextRequest_ForDialogueGeneration_ShouldBeWellFormed()
        {
            // Act
            var request = new ContextRequest("player.victory", 8);

            // Assert
            Assert.AreEqual("player.victory", request.current_event);
            Assert.AreEqual(8, request.limit);
        }

        [Test]
        public void SearchRequest_ForSemanticSearch_ShouldBeWellFormed()
        {
            // Act
            var request = new SearchRequest(
                "all my epic boss battles with dragons",
                10,
                0.75f
            );

            // Assert
            Assert.AreEqual("all my epic boss battles with dragons", request.query);
            Assert.AreEqual(10, request.limit);
            Assert.AreEqual(0.75f, request.min_similarity);
        }

        #endregion
    }
}
