using System;
using System.Collections;
using UnityEngine;
using AGL.SDK.Core;
using AGL.SDK.Models;
using AGL.SDK.Utils;

namespace AGL.SDK.Services
{
    /// <summary>
    /// Client for Emotion Service
    /// Analyzes game events to detect player emotions
    /// </summary>
    public class EmotionService
    {
        private readonly HttpClient httpClient;
        private readonly AGLConfig config;

        public EmotionService(AGLConfig config)
        {
            this.config = config;
            this.httpClient = new HttpClient(
                config.EmotionServiceUrl,
                config.RequestTimeout,
                config.EnableDebugLogs
            );
        }

        /// <summary>
        /// Analyze emotion from game event
        /// </summary>
        /// <param name="request">Emotion analysis request</param>
        /// <param name="onSuccess">Success callback with emotion response</param>
        /// <param name="onError">Error callback</param>
        public IEnumerator AnalyzeEmotion(
            EmotionRequest request,
            Action<EmotionResponse> onSuccess,
            Action<string> onError)
        {
            yield return httpClient.Post<EmotionRequest, EmotionResponse>(
                "analyze",
                request,
                onSuccess,
                onError
            );
        }

        /// <summary>
        /// Analyze emotion with simplified parameters
        /// </summary>
        public IEnumerator AnalyzeEvent(
            string eventType,
            Action<EmotionResponse> onSuccess,
            Action<string> onError)
        {
            var request = new EmotionRequest(eventType);
            yield return AnalyzeEmotion(request, onSuccess, onError);
        }

        /// <summary>
        /// Get emotion service health
        /// </summary>
        public IEnumerator GetHealth(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("health", onSuccess, onError);
        }

        /// <summary>
        /// Get emotion service statistics
        /// </summary>
        public IEnumerator GetStats(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("stats", onSuccess, onError);
        }

        /// <summary>
        /// Clear emotion cache
        /// </summary>
        public IEnumerator ClearCache(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Post<object, object>("cache/clear", new { }, onSuccess, onError);
        }

        #region Helper Methods

        /// <summary>
        /// Create emotion request for player victory
        /// </summary>
        public static EmotionRequest CreateVictoryRequest(bool isMVP = false, int winStreak = 0)
        {
            var request = new EmotionRequest("player.victory");
            if (isMVP) request.data["mvp"] = true;
            if (winStreak > 0) request.data["winStreak"] = winStreak;
            return request;
        }

        /// <summary>
        /// Create emotion request for player defeat
        /// </summary>
        public static EmotionRequest CreateDefeatRequest(int lossStreak = 0)
        {
            var request = new EmotionRequest("player.defeat");
            if (lossStreak > 0) request.data["lossStreak"] = lossStreak;
            return request;
        }

        /// <summary>
        /// Create emotion request for kill event
        /// </summary>
        public static EmotionRequest CreateKillRequest(int killCount = 1, bool isLegendary = false)
        {
            var request = new EmotionRequest("player.kill");
            request.data["killCount"] = killCount;
            if (isLegendary) request.data["isLegendary"] = true;
            return request;
        }

        /// <summary>
        /// Create emotion request for achievement
        /// </summary>
        public static EmotionRequest CreateAchievementRequest(string rarity = "common")
        {
            var request = new EmotionRequest("player.achievement");
            request.data["rarity"] = rarity;
            return request;
        }

        /// <summary>
        /// Add player health context
        /// </summary>
        public static void AddHealthContext(EmotionRequest request, float healthPercent)
        {
            request.context["playerHealth"] = healthPercent;
        }

        /// <summary>
        /// Add combat state context
        /// </summary>
        public static void AddCombatContext(EmotionRequest request, bool inCombat)
        {
            request.context["inCombat"] = inCombat;
        }

        #endregion
    }
}
