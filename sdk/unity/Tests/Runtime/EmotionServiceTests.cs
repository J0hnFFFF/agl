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
    /// Unit tests for EmotionService
    /// Tests emotion analysis, helper methods, and request creation
    /// </summary>
    public class EmotionServiceTests
    {
        private AGLConfig config;
        private EmotionService service;

        [SetUp]
        public void Setup()
        {
            // Create test configuration
            config = ScriptableObject.CreateInstance<AGLConfig>();
            config.ApiKey = "test-api-key";
            config.EmotionServiceUrl = "http://localhost:8000";
            config.RequestTimeout = 5f;
            config.EnableDebugLogs = false;

            // Initialize service
            service = new EmotionService(config);
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
                var invalidService = new EmotionService(null);
            });
        }

        #endregion

        #region Helper Methods - Victory Request

        [Test]
        public void CreateVictoryRequest_WithDefaults_ShouldCreateBasicRequest()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest();

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual(EventType.Victory, request.Type);
            Assert.IsFalse(request.data.ContainsKey("mvp"));
            Assert.IsFalse(request.data.ContainsKey("winStreak"));
        }

        [Test]
        public void CreateVictoryRequest_WithMVP_ShouldIncludeMVPFlag()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest(isMVP: true);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("mvp"));
            Assert.AreEqual(true, request.data["mvp"]);
        }

        [Test]
        public void CreateVictoryRequest_WithWinStreak_ShouldIncludeStreak()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest(winStreak: 5);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("winStreak"));
            Assert.AreEqual(5, request.data["winStreak"]);
        }

        [Test]
        public void CreateVictoryRequest_WithMVPAndStreak_ShouldIncludeBoth()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest(isMVP: true, winStreak: 3);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("mvp"));
            Assert.IsTrue(request.data.ContainsKey("winStreak"));
            Assert.AreEqual(true, request.data["mvp"]);
            Assert.AreEqual(3, request.data["winStreak"]);
        }

        [Test]
        public void CreateVictoryRequest_WithZeroStreak_ShouldNotIncludeStreak()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest(winStreak: 0);

            // Assert
            Assert.IsFalse(request.data.ContainsKey("winStreak"));
        }

        #endregion

        #region Helper Methods - Defeat Request

        [Test]
        public void CreateDefeatRequest_WithDefaults_ShouldCreateBasicRequest()
        {
            // Act
            var request = EmotionService.CreateDefeatRequest();

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual(EventType.Defeat, request.Type);
            Assert.IsFalse(request.data.ContainsKey("lossStreak"));
        }

        [Test]
        public void CreateDefeatRequest_WithLossStreak_ShouldIncludeStreak()
        {
            // Act
            var request = EmotionService.CreateDefeatRequest(lossStreak: 3);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("lossStreak"));
            Assert.AreEqual(3, request.data["lossStreak"]);
        }

        [Test]
        public void CreateDefeatRequest_WithZeroStreak_ShouldNotIncludeStreak()
        {
            // Act
            var request = EmotionService.CreateDefeatRequest(lossStreak: 0);

            // Assert
            Assert.IsFalse(request.data.ContainsKey("lossStreak"));
        }

        #endregion

        #region Helper Methods - Kill Request

        [Test]
        public void CreateKillRequest_WithDefaults_ShouldCreateBasicRequest()
        {
            // Act
            var request = EmotionService.CreateKillRequest();

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual(EventType.Kill, request.Type);
            Assert.IsTrue(request.data.ContainsKey("killCount"));
            Assert.AreEqual(1, request.data["killCount"]);
            Assert.IsFalse(request.data.ContainsKey("isLegendary"));
        }

        [Test]
        public void CreateKillRequest_WithMultiKill_ShouldIncludeCount()
        {
            // Act
            var request = EmotionService.CreateKillRequest(killCount: 5);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("killCount"));
            Assert.AreEqual(5, request.data["killCount"]);
        }

        [Test]
        public void CreateKillRequest_WithLegendary_ShouldIncludeFlag()
        {
            // Act
            var request = EmotionService.CreateKillRequest(isLegendary: true);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("isLegendary"));
            Assert.AreEqual(true, request.data["isLegendary"]);
        }

        [Test]
        public void CreateKillRequest_WithCountAndLegendary_ShouldIncludeBoth()
        {
            // Act
            var request = EmotionService.CreateKillRequest(killCount: 10, isLegendary: true);

            // Assert
            Assert.IsTrue(request.data.ContainsKey("killCount"));
            Assert.IsTrue(request.data.ContainsKey("isLegendary"));
            Assert.AreEqual(10, request.data["killCount"]);
            Assert.AreEqual(true, request.data["isLegendary"]);
        }

        #endregion

        #region Helper Methods - Achievement Request

        [Test]
        public void CreateAchievementRequest_WithDefaults_ShouldCreateCommonRequest()
        {
            // Act
            var request = EmotionService.CreateAchievementRequest();

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual(EventType.Achievement, request.Type);
            Assert.IsTrue(request.data.ContainsKey("rarity"));
            Assert.AreEqual("common", request.data["rarity"]);
        }

        [Test]
        public void CreateAchievementRequest_WithEpic_ShouldSetRarity()
        {
            // Act
            var request = EmotionService.CreateAchievementRequest("epic");

            // Assert
            Assert.AreEqual("epic", request.data["rarity"]);
        }

        [Test]
        public void CreateAchievementRequest_WithLegendary_ShouldSetRarity()
        {
            // Act
            var request = EmotionService.CreateAchievementRequest("legendary");

            // Assert
            Assert.AreEqual("legendary", request.data["rarity"]);
        }

        #endregion

        #region Context Helper Methods

        [Test]
        public void AddHealthContext_WithValidPercent_ShouldAddToContext()
        {
            // Arrange
            var request = new EmotionRequest(EventType.Victory);

            // Act
            EmotionService.AddHealthContext(request, 75.5f);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("playerHealth"));
            Assert.AreEqual(75.5f, request.context["playerHealth"]);
        }

        [Test]
        public void AddHealthContext_WithLowHealth_ShouldAddToContext()
        {
            // Arrange
            var request = new EmotionRequest(EventType.Victory);

            // Act
            EmotionService.AddHealthContext(request, 15.0f);

            // Assert
            Assert.AreEqual(15.0f, request.context["playerHealth"]);
        }

        [Test]
        public void AddCombatContext_WithInCombat_ShouldAddFlag()
        {
            // Arrange
            var request = new EmotionRequest(EventType.Kill);

            // Act
            EmotionService.AddCombatContext(request, true);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("inCombat"));
            Assert.AreEqual(true, request.context["inCombat"]);
        }

        [Test]
        public void AddCombatContext_WithOutOfCombat_ShouldAddFlag()
        {
            // Arrange
            var request = new EmotionRequest(EventType.Victory);

            // Act
            EmotionService.AddCombatContext(request, false);

            // Assert
            Assert.IsTrue(request.context.ContainsKey("inCombat"));
            Assert.AreEqual(false, request.context["inCombat"]);
        }

        [Test]
        public void MultipleContextAdditions_ShouldAllBePresent()
        {
            // Arrange
            var request = new EmotionRequest(EventType.Victory);

            // Act
            EmotionService.AddHealthContext(request, 50.0f);
            EmotionService.AddCombatContext(request, true);

            // Assert
            Assert.AreEqual(2, request.context.Count);
            Assert.AreEqual(50.0f, request.context["playerHealth"]);
            Assert.AreEqual(true, request.context["inCombat"]);
        }

        #endregion

        #region Request Validation Tests

        [Test]
        public void EmotionRequest_WithEventType_ShouldCreateRequest()
        {
            // Act
            var request = new EmotionRequest(EventType.Victory);

            // Assert
            Assert.IsNotNull(request);
            Assert.AreEqual(EventType.Victory, request.Type);
            Assert.IsNotNull(request.data);
            Assert.IsNotNull(request.context);
            Assert.IsFalse(request.ForceML);
        }

        [Test]
        public void EmotionRequest_AllEventTypes_ShouldWork()
        {
            // Act & Assert
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Victory));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Defeat));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Kill));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Death));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Achievement));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.LevelUp));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.Loot));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.SessionStart));
            Assert.DoesNotThrow(() => new EmotionRequest(EventType.SessionEnd));
        }

        #endregion

        #region Integration Readiness Tests

        [Test]
        public void VictoryScenario_HighHealthMVP_ShouldBeWellFormed()
        {
            // Act
            var request = EmotionService.CreateVictoryRequest(isMVP: true, winStreak: 5);
            EmotionService.AddHealthContext(request, 95.0f);
            EmotionService.AddCombatContext(request, false);

            // Assert
            Assert.AreEqual(EventType.Victory, request.Type);
            Assert.AreEqual(2, request.data.Count);
            Assert.AreEqual(2, request.context.Count);
            Assert.AreEqual(true, request.data["mvp"]);
            Assert.AreEqual(5, request.data["winStreak"]);
            Assert.AreEqual(95.0f, request.context["playerHealth"]);
            Assert.AreEqual(false, request.context["inCombat"]);
        }

        [Test]
        public void DefeatScenario_LowHealthStreak_ShouldBeWellFormed()
        {
            // Act
            var request = EmotionService.CreateDefeatRequest(lossStreak: 3);
            EmotionService.AddHealthContext(request, 5.0f);
            EmotionService.AddCombatContext(request, false);

            // Assert
            Assert.AreEqual(EventType.Defeat, request.Type);
            Assert.AreEqual(1, request.data.Count);
            Assert.AreEqual(2, request.context.Count);
            Assert.AreEqual(3, request.data["lossStreak"]);
            Assert.AreEqual(5.0f, request.context["playerHealth"]);
        }

        [Test]
        public void AchievementScenario_LegendaryFirstTime_ShouldBeWellFormed()
        {
            // Act
            var request = EmotionService.CreateAchievementRequest("legendary");

            // Assert
            Assert.AreEqual(EventType.Achievement, request.Type);
            Assert.AreEqual("legendary", request.data["rarity"]);
        }

        [Test]
        public void KillScenario_LegendaryMultiKill_ShouldBeWellFormed()
        {
            // Act
            var request = EmotionService.CreateKillRequest(killCount: 5, isLegendary: true);
            EmotionService.AddCombatContext(request, true);

            // Assert
            Assert.AreEqual(EventType.Kill, request.Type);
            Assert.AreEqual(2, request.data.Count);
            Assert.AreEqual(5, request.data["killCount"]);
            Assert.AreEqual(true, request.data["isLegendary"]);
            Assert.AreEqual(true, request.context["inCombat"]);
        }

        #endregion
    }
}
