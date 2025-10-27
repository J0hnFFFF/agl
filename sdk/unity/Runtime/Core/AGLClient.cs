using System;
using UnityEngine;
using AGL.SDK.Services;

namespace AGL.SDK.Core
{
    /// <summary>
    /// Main AGL SDK client
    /// Provides access to all AGL services
    /// </summary>
    public class AGLClient : MonoBehaviour
    {
        [SerializeField]
        private AGLConfig config;

        /// <summary>
        /// Emotion analysis service
        /// </summary>
        public EmotionService Emotion { get; private set; }

        /// <summary>
        /// Dialogue generation service
        /// </summary>
        public DialogueService Dialogue { get; private set; }

        /// <summary>
        /// Memory management service
        /// </summary>
        public MemoryService Memory { get; private set; }

        /// <summary>
        /// Whether the client is initialized
        /// </summary>
        public bool IsInitialized { get; private set; }

        /// <summary>
        /// Current configuration
        /// </summary>
        public AGLConfig Config => config;

        #region Unity Lifecycle

        private void Awake()
        {
            // Ensure config exists
            if (config == null)
            {
                config = AGLConfig.CreateDefault();
            }

            Initialize();
        }

        #endregion

        #region Initialization

        /// <summary>
        /// Initialize the AGL client
        /// </summary>
        public void Initialize()
        {
            if (IsInitialized)
            {
                Debug.LogWarning("[AGL] Client already initialized");
                return;
            }

            // Validate configuration
            if (!config.IsValid(out string error))
            {
                Debug.LogError($"[AGL] Configuration invalid: {error}");
                return;
            }

            // Initialize services
            Emotion = new EmotionService(config);
            Dialogue = new DialogueService(config);
            Memory = new MemoryService(config);

            IsInitialized = true;

            Debug.Log("[AGL] Client initialized successfully");
        }

        /// <summary>
        /// Initialize with custom configuration
        /// </summary>
        public void Initialize(AGLConfig customConfig)
        {
            config = customConfig;
            Initialize();
        }

        #endregion

        #region Configuration

        /// <summary>
        /// Set player ID
        /// </summary>
        public void SetPlayerId(string playerId)
        {
            config.PlayerId = playerId;
            Debug.Log($"[AGL] Player ID set to: {playerId}");
        }

        /// <summary>
        /// Set game ID
        /// </summary>
        public void SetGameId(string gameId)
        {
            config.GameId = gameId;
            Debug.Log($"[AGL] Game ID set to: {gameId}");
        }

        #endregion

        #region Singleton Pattern (Optional)

        private static AGLClient instance;

        /// <summary>
        /// Singleton instance (optional pattern)
        /// </summary>
        public static AGLClient Instance
        {
            get
            {
                if (instance == null)
                {
                    instance = FindObjectOfType<AGLClient>();
                    if (instance == null)
                    {
                        GameObject go = new GameObject("AGLClient");
                        instance = go.AddComponent<AGLClient>();
                        DontDestroyOnLoad(go);
                    }
                }
                return instance;
            }
        }

        #endregion

        #region Health Checks

        /// <summary>
        /// Check health of all services
        /// </summary>
        public void CheckHealth(Action<string> onComplete)
        {
            StartCoroutine(CheckHealthCoroutine(onComplete));
        }

        private System.Collections.IEnumerator CheckHealthCoroutine(Action<string> onComplete)
        {
            string report = "=== AGL Services Health ===\n";

            // Check Emotion Service
            bool emotionHealthy = false;
            yield return Emotion.GetHealth(
                (response) => {
                    emotionHealthy = true;
                    report += "Emotion Service: OK\n";
                },
                (error) => {
                    report += $"Emotion Service: ERROR - {error}\n";
                }
            );

            // Check Dialogue Service
            bool dialogueHealthy = false;
            yield return Dialogue.GetHealth(
                (response) => {
                    dialogueHealthy = true;
                    report += "Dialogue Service: OK\n";
                },
                (error) => {
                    report += $"Dialogue Service: ERROR - {error}\n";
                }
            );

            // Check Memory Service
            bool memoryHealthy = false;
            yield return Memory.GetHealth(
                (response) => {
                    memoryHealthy = true;
                    report += "Memory Service: OK\n";
                },
                (error) => {
                    report += $"Memory Service: ERROR - {error}\n";
                }
            );

            report += "===========================";
            Debug.Log(report);
            onComplete?.Invoke(report);
        }

        #endregion
    }
}
