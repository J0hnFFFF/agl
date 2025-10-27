using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using AGL.SDK.Core;
using AGL.SDK.Services;

namespace AGL.Tests
{
    /// <summary>
    /// Integration tests for AGLClient
    /// Tests client initialization, configuration, and service integration
    /// </summary>
    public class AGLClientTests
    {
        private GameObject clientGameObject;
        private AGLClient client;
        private AGLConfig config;

        [SetUp]
        public void Setup()
        {
            // Create test configuration
            config = ScriptableObject.CreateInstance<AGLConfig>();

            // Create GameObject with AGLClient component
            clientGameObject = new GameObject("TestAGLClient");
            client = clientGameObject.AddComponent<AGLClient>();
        }

        [TearDown]
        public void TearDown()
        {
            // Clean up
            if (clientGameObject != null)
            {
                Object.DestroyImmediate(clientGameObject);
            }
            if (config != null)
            {
                Object.DestroyImmediate(config);
            }
        }

        #region Configuration Tests

        [Test]
        public void AGLConfig_CreateDefault_ShouldHaveDefaultValues()
        {
            // Act
            var defaultConfig = AGLConfig.CreateDefault();

            // Assert
            Assert.IsNotNull(defaultConfig);
            Assert.AreEqual("http://localhost:3000", defaultConfig.ApiBaseUrl);
            Assert.AreEqual("ws://localhost:3001", defaultConfig.RealtimeUrl);
            Assert.AreEqual("http://localhost:8000", defaultConfig.EmotionServiceUrl);
            Assert.AreEqual("http://localhost:8001", defaultConfig.DialogueServiceUrl);
            Assert.AreEqual("http://localhost:3002", defaultConfig.MemoryServiceUrl);
            Assert.AreEqual(true, defaultConfig.EnableDebugLogs);
            Assert.AreEqual(30, defaultConfig.RequestTimeout);
        }

        [Test]
        public void AGLConfig_WithoutApiKey_ShouldBeInvalid()
        {
            // Arrange
            var invalidConfig = AGLConfig.CreateDefault();

            // Act
            bool isValid = invalidConfig.IsValid(out string error);

            // Assert
            Assert.IsFalse(isValid);
            Assert.IsNotNull(error);
            Assert.IsTrue(error.Contains("API key"));
        }

        [Test]
        public void AGLConfig_WithApiKey_ShouldBeValid()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            // Use reflection to set private field for testing
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");

            // Act
            bool isValid = validConfig.IsValid(out string error);

            // Assert
            Assert.IsTrue(isValid);
            Assert.IsNull(error);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void AGLConfig_PlayerIdProperty_ShouldGetAndSet()
        {
            // Arrange
            var testConfig = AGLConfig.CreateDefault();

            // Act
            testConfig.PlayerId = "player-123";

            // Assert
            Assert.AreEqual("player-123", testConfig.PlayerId);
        }

        [Test]
        public void AGLConfig_GameIdProperty_ShouldGetAndSet()
        {
            // Arrange
            var testConfig = AGLConfig.CreateDefault();

            // Act
            testConfig.GameId = "game-456";

            // Assert
            Assert.AreEqual("game-456", testConfig.GameId);
        }

        #endregion

        #region Initialization Tests

        [Test]
        public void AGLClient_WithValidConfig_ShouldInitialize()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");

            // Act
            client.Initialize(validConfig);

            // Assert
            Assert.IsTrue(client.IsInitialized);
            Assert.IsNotNull(client.Emotion);
            Assert.IsNotNull(client.Dialogue);
            Assert.IsNotNull(client.Memory);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void AGLClient_ServicesAfterInitialization_ShouldBeAccessible()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");

            // Act
            client.Initialize(validConfig);

            // Assert
            Assert.IsNotNull(client.Emotion);
            Assert.IsInstanceOf<EmotionService>(client.Emotion);
            Assert.IsNotNull(client.Dialogue);
            Assert.IsInstanceOf<DialogueService>(client.Dialogue);
            Assert.IsNotNull(client.Memory);
            Assert.IsInstanceOf<MemoryService>(client.Memory);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void AGLClient_ConfigProperty_ShouldReturnConfig()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");

            // Act
            client.Initialize(validConfig);

            // Assert
            Assert.IsNotNull(client.Config);
            Assert.AreEqual(validConfig, client.Config);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        #endregion

        #region ID Management Tests

        [Test]
        public void SetPlayerId_WithValidId_ShouldUpdateConfig()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetPlayerId("player-999");

            // Assert
            Assert.AreEqual("player-999", client.Config.PlayerId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetPlayerId_MultipleTimes_ShouldUpdateEachTime()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetPlayerId("player-001");
            Assert.AreEqual("player-001", client.Config.PlayerId);

            client.SetPlayerId("player-002");
            Assert.AreEqual("player-002", client.Config.PlayerId);

            client.SetPlayerId("player-003");

            // Assert
            Assert.AreEqual("player-003", client.Config.PlayerId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetGameId_WithValidId_ShouldUpdateConfig()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetGameId("game-777");

            // Assert
            Assert.AreEqual("game-777", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetGameId_MultipleTimes_ShouldUpdateEachTime()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetGameId("game-alpha");
            Assert.AreEqual("game-alpha", client.Config.GameId);

            client.SetGameId("game-beta");

            // Assert
            Assert.AreEqual("game-beta", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetPlayerIdAndGameId_Together_ShouldBothPersist()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetPlayerId("player-456");
            client.SetGameId("game-789");

            // Assert
            Assert.AreEqual("player-456", client.Config.PlayerId);
            Assert.AreEqual("game-789", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        #endregion

        #region Integration Readiness Tests

        [Test]
        public void FullInitializationFlow_ShouldWorkCorrectly()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "my-api-key");

            // Act - Initialize client
            client.Initialize(validConfig);

            // Act - Set IDs
            client.SetPlayerId("player-integration-test");
            client.SetGameId("game-integration-test");

            // Assert - Client ready
            Assert.IsTrue(client.IsInitialized);
            Assert.IsNotNull(client.Emotion);
            Assert.IsNotNull(client.Dialogue);
            Assert.IsNotNull(client.Memory);
            Assert.AreEqual("player-integration-test", client.Config.PlayerId);
            Assert.AreEqual("game-integration-test", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void TypicalGameStartupFlow_ShouldInitializeCorrectly()
        {
            // Simulate typical game startup sequence

            // Step 1: Create configuration
            var gameConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(gameConfig, "production-api-key");

            // Step 2: Initialize AGL client
            client.Initialize(gameConfig);
            Assert.IsTrue(client.IsInitialized);

            // Step 3: User logs in, set player ID
            client.SetPlayerId("user-12345");
            Assert.AreEqual("user-12345", client.Config.PlayerId);

            // Step 4: Set game context
            client.SetGameId("my-awesome-game");
            Assert.AreEqual("my-awesome-game", client.Config.GameId);

            // Step 5: Services are ready to use
            Assert.IsNotNull(client.Emotion);
            Assert.IsNotNull(client.Dialogue);
            Assert.IsNotNull(client.Memory);

            // Clean up
            Object.DestroyImmediate(gameConfig);
        }

        #endregion

        #region Edge Case Tests

        [Test]
        public void SetPlayerId_WithEmptyString_ShouldStillSet()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetPlayerId("");

            // Assert
            Assert.AreEqual("", client.Config.PlayerId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetGameId_WithEmptyString_ShouldStillSet()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetGameId("");

            // Assert
            Assert.AreEqual("", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetPlayerId_WithSpecialCharacters_ShouldAccept()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetPlayerId("player@test.com");

            // Assert
            Assert.AreEqual("player@test.com", client.Config.PlayerId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        [Test]
        public void SetGameId_WithUnicode_ShouldAccept()
        {
            // Arrange
            var validConfig = ScriptableObject.CreateInstance<AGLConfig>();
            var apiKeyField = typeof(AGLConfig).GetField("apiKey",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            apiKeyField.SetValue(validConfig, "test-api-key");
            client.Initialize(validConfig);

            // Act
            client.SetGameId("游戏-123");

            // Assert
            Assert.AreEqual("游戏-123", client.Config.GameId);

            // Clean up
            Object.DestroyImmediate(validConfig);
        }

        #endregion
    }
}
