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
    /// Unit tests for DialogueService
    /// Tests dialogue generation, helper methods, and error handling
    /// </summary>
    public class DialogueServiceTests
    {
        private AGLConfig config;
        private DialogueService service;

        [SetUp]
        public void Setup()
        {
            // Create test configuration
            config = ScriptableObject.CreateInstance<AGLConfig>();
            config.ApiKey = "test-api-key";
            config.DialogueServiceUrl = "http://localhost:8001";
            config.RequestTimeout = 5f;
            config.EnableDebugLogs = false;

            // Initialize service
            service = new DialogueService(config);
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
                var invalidService = new DialogueService(null);
            });
        }

        #endregion

        #region Helper Methods Tests

        [Test]
        public void AddContext_WithValidKeyValue_ShouldAddToContext()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful);

            // Act
            DialogueService.AddContext(request, "test_key", "test_value");

            // Assert
            Assert.IsTrue(request.context.ContainsKey("test_key"));
            Assert.AreEqual("test_value", request.context["test_key"]);
        }

        [Test]
        public void AddRarityContext_WithRarity_ShouldAddRarityToContext()
        {
            // Arrange
            var request = new DialogueRequest("player.achievement", "proud", Persona.Cool);

            // Act
            DialogueService.AddRarityContext(request, "legendary");

            // Assert
            Assert.IsTrue(request.context.ContainsKey("rarity"));
            Assert.AreEqual("legendary", request.context["rarity"]);
        }

        [Test]
        public void AddFirstTimeContext_WithTrue_ShouldAddFirstTimeFlag()
        {
            // Arrange
            var request = new DialogueRequest("player.achievement", "amazed", Persona.Cute);

            // Act
            DialogueService.AddFirstTimeContext(request, true);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("is_first_time"));
            Assert.AreEqual(true, request.context["is_first_time"]);
        }

        [Test]
        public void AddWinStreakContext_WithStreak_ShouldAddStreakToContext()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "excited", Persona.Cheerful);

            // Act
            DialogueService.AddWinStreakContext(request, 5);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("win_streak"));
            Assert.AreEqual(5, request.context["win_streak"]);
        }

        [Test]
        public void AddDifficultyContext_WithDifficulty_ShouldAddToContext()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "proud", Persona.Cool);

            // Act
            DialogueService.AddDifficultyContext(request, "hard");

            // Assert
            Assert.IsTrue(request.context.ContainsKey("difficulty"));
            Assert.AreEqual("hard", request.context["difficulty"]);
        }

        [Test]
        public void MultipleContextAdditions_ShouldAllBePresent()
        {
            // Arrange
            var request = new DialogueRequest("player.achievement", "proud", Persona.Cool);

            // Act
            DialogueService.AddRarityContext(request, "legendary");
            DialogueService.AddFirstTimeContext(request, true);
            DialogueService.AddDifficultyContext(request, "nightmare");

            // Assert
            Assert.AreEqual(3, request.context.Count);
            Assert.AreEqual("legendary", request.context["rarity"]);
            Assert.AreEqual(true, request.context["is_first_time"]);
            Assert.AreEqual("nightmare", request.context["difficulty"]);
        }

        #endregion

        #region Request Validation Tests

        [Test]
        public void DialogueRequest_WithValidParameters_ShouldCreateRequest()
        {
            // Act
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful, "en");

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual("player.victory", request.event_type);
            Assert.AreEqual("happy", request.emotion);
            Assert.AreEqual("cheerful", request.persona);
            Assert.AreEqual("en", request.language);
            Assert.IsFalse(request.force_llm);
            Assert.IsNotNull(request.context);
        }

        [Test]
        public void DialogueRequest_WithDefaultLanguage_ShouldBeZh()
        {
            // Act
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful);

            // Assert
            Assert.AreEqual("zh", request.language);
        }

        [Test]
        public void DialogueRequest_WithMultipleLanguages_ShouldWork()
        {
            // Arrange & Act
            var zhRequest = new DialogueRequest("player.victory", "happy", Persona.Cheerful, "zh");
            var enRequest = new DialogueRequest("player.victory", "happy", Persona.Cheerful, "en");
            var jaRequest = new DialogueRequest("player.victory", "happy", Persona.Cheerful, "ja");

            // Assert
            Assert.AreEqual("zh", zhRequest.language);
            Assert.AreEqual("en", enRequest.language);
            Assert.AreEqual("ja", jaRequest.language);
        }

        #endregion

        #region Persona Tests

        [Test]
        public void Persona_AllValues_ShouldConvertToLowercase()
        {
            // Arrange & Act
            var cheerfulRequest = new DialogueRequest("player.victory", "happy", Persona.Cheerful);
            var coolRequest = new DialogueRequest("player.victory", "happy", Persona.Cool);
            var cuteRequest = new DialogueRequest("player.victory", "happy", Persona.Cute);

            // Assert
            Assert.AreEqual("cheerful", cheerfulRequest.persona);
            Assert.AreEqual("cool", coolRequest.persona);
            Assert.AreEqual("cute", cuteRequest.persona);
        }

        #endregion

        #region Edge Case Tests

        [Test]
        public void AddContext_WithNullValue_ShouldStillAdd()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful);

            // Act
            DialogueService.AddContext(request, "nullable_key", null);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("nullable_key"));
            Assert.IsNull(request.context["nullable_key"]);
        }

        [Test]
        public void AddContext_WithEmptyKey_ShouldStillAdd()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful);

            // Act
            DialogueService.AddContext(request, "", "value");

            // Assert
            Assert.IsTrue(request.context.ContainsKey(""));
        }

        [Test]
        public void AddContext_OverwriteExistingKey_ShouldUpdateValue()
        {
            // Arrange
            var request = new DialogueRequest("player.victory", "happy", Persona.Cheerful);
            DialogueService.AddContext(request, "test_key", "old_value");

            // Act
            DialogueService.AddContext(request, "test_key", "new_value");

            // Assert
            Assert.AreEqual("new_value", request.context["test_key"]);
            Assert.AreEqual(1, request.context.Count);
        }

        #endregion

        #region Integration Readiness Tests

        [Test]
        public void Service_WithPlayerId_ShouldBeReadyForIntegration()
        {
            // Arrange
            config.PlayerId = "player-123";
            var serviceWithPlayer = new DialogueService(config);

            // Assert
            Assert.IsNotNull(serviceWithPlayer);
        }

        [Test]
        public void DialogueRequest_ForVictory_ShouldBeWellFormed()
        {
            // Act
            var request = new DialogueRequest("player.victory", "excited", Persona.Cheerful, "en");
            DialogueService.AddWinStreakContext(request, 5);
            DialogueService.AddDifficultyContext(request, "hard");

            // Assert
            Assert.AreEqual("player.victory", request.event_type);
            Assert.AreEqual("excited", request.emotion);
            Assert.AreEqual("cheerful", request.persona);
            Assert.AreEqual("en", request.language);
            Assert.AreEqual(2, request.context.Count);
        }

        [Test]
        public void DialogueRequest_ForAchievement_ShouldBeWellFormed()
        {
            // Act
            var request = new DialogueRequest("player.achievement", "proud", Persona.Cool, "ja");
            DialogueService.AddRarityContext(request, "legendary");
            DialogueService.AddFirstTimeContext(request, true);

            // Assert
            Assert.AreEqual("player.achievement", request.event_type);
            Assert.AreEqual("proud", request.emotion);
            Assert.AreEqual("cool", request.persona);
            Assert.AreEqual("ja", request.language);
            Assert.AreEqual(2, request.context.Count);
            Assert.AreEqual("legendary", request.context["rarity"]);
            Assert.AreEqual(true, request.context["is_first_time"]);
        }

        #endregion
    }
}
