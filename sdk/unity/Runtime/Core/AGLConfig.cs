using System;
using UnityEngine;

namespace AGL.SDK.Core
{
    /// <summary>
    /// Configuration for AGL Companion SDK
    /// </summary>
    [Serializable]
    public class AGLConfig
    {
        /// <summary>
        /// API key for authentication
        /// </summary>
        [SerializeField]
        private string apiKey = "";

        /// <summary>
        /// Base URL for API service
        /// </summary>
        [SerializeField]
        private string apiBaseUrl = "http://localhost:3000";

        /// <summary>
        /// WebSocket URL for realtime gateway
        /// </summary>
        [SerializeField]
        private string realtimeUrl = "ws://localhost:3001";

        /// <summary>
        /// Emotion service URL
        /// </summary>
        [SerializeField]
        private string emotionServiceUrl = "http://localhost:8000";

        /// <summary>
        /// Dialogue service URL
        /// </summary>
        [SerializeField]
        private string dialogueServiceUrl = "http://localhost:8001";

        /// <summary>
        /// Memory service URL
        /// </summary>
        [SerializeField]
        private string memoryServiceUrl = "http://localhost:3002";

        /// <summary>
        /// Enable debug logging
        /// </summary>
        [SerializeField]
        private bool enableDebugLogs = true;

        /// <summary>
        /// Request timeout in seconds
        /// </summary>
        [SerializeField]
        private int requestTimeout = 30;

        /// <summary>
        /// Player ID (set at runtime)
        /// </summary>
        public string PlayerId { get; set; }

        /// <summary>
        /// Game ID (set at runtime)
        /// </summary>
        public string GameId { get; set; }

        // Public accessors
        public string ApiKey => apiKey;
        public string ApiBaseUrl => apiBaseUrl;
        public string RealtimeUrl => realtimeUrl;
        public string EmotionServiceUrl => emotionServiceUrl;
        public string DialogueServiceUrl => dialogueServiceUrl;
        public string MemoryServiceUrl => memoryServiceUrl;
        public bool EnableDebugLogs => enableDebugLogs;
        public int RequestTimeout => requestTimeout;

        /// <summary>
        /// Create default configuration
        /// </summary>
        public static AGLConfig CreateDefault()
        {
            return new AGLConfig
            {
                apiKey = "",
                apiBaseUrl = "http://localhost:3000",
                realtimeUrl = "ws://localhost:3001",
                emotionServiceUrl = "http://localhost:8000",
                dialogueServiceUrl = "http://localhost:8001",
                memoryServiceUrl = "http://localhost:3002",
                enableDebugLogs = true,
                requestTimeout = 30
            };
        }

        /// <summary>
        /// Validate configuration
        /// </summary>
        public bool IsValid(out string error)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                error = "API key is required";
                return false;
            }

            if (string.IsNullOrEmpty(apiBaseUrl))
            {
                error = "API base URL is required";
                return false;
            }

            error = null;
            return true;
        }
    }
}
