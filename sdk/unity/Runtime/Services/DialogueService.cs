using System;
using System.Collections;
using UnityEngine;
using AGL.SDK.Core;
using AGL.SDK.Models;
using AGL.SDK.Utils;

namespace AGL.SDK.Services
{
    /// <summary>
    /// Client for Dialogue Service
    /// Generates contextual dialogue for companion characters
    /// </summary>
    public class DialogueService
    {
        private readonly HttpClient httpClient;
        private readonly AGLConfig config;

        public DialogueService(AGLConfig config)
        {
            this.config = config;
            this.httpClient = new HttpClient(
                config.DialogueServiceUrl,
                config.RequestTimeout,
                config.EnableDebugLogs
            );
        }

        /// <summary>
        /// Generate dialogue from event and emotion
        /// </summary>
        /// <param name="request">Dialogue generation request</param>
        /// <param name="onSuccess">Success callback with dialogue response</param>
        /// <param name="onError">Error callback</param>
        public IEnumerator GenerateDialogue(
            DialogueRequest request,
            Action<DialogueResponse> onSuccess,
            Action<string> onError)
        {
            yield return httpClient.Post<DialogueRequest, DialogueResponse>(
                "generate",
                request,
                onSuccess,
                onError
            );
        }

        /// <summary>
        /// Generate dialogue with simplified parameters
        /// </summary>
        public IEnumerator Generate(
            string eventType,
            string emotion,
            Persona persona,
            Action<DialogueResponse> onSuccess,
            Action<string> onError)
        {
            var request = new DialogueRequest(eventType, emotion, persona);
            if (!string.IsNullOrEmpty(config.PlayerId))
            {
                request.player_id = config.PlayerId;
            }
            yield return GenerateDialogue(request, onSuccess, onError);
        }

        /// <summary>
        /// Get dialogue service health
        /// </summary>
        public IEnumerator GetHealth(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("health", onSuccess, onError);
        }

        /// <summary>
        /// Get dialogue service statistics
        /// </summary>
        public IEnumerator GetStats(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("stats", onSuccess, onError);
        }

        /// <summary>
        /// Get template count
        /// </summary>
        public IEnumerator GetTemplateCount(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("templates/count", onSuccess, onError);
        }

        /// <summary>
        /// Clear dialogue cache
        /// </summary>
        public IEnumerator ClearCache(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Post<object, object>("cache/clear", new { }, onSuccess, onError);
        }

        #region Helper Methods

        /// <summary>
        /// Add context to dialogue request
        /// </summary>
        public static void AddContext(DialogueRequest request, string key, object value)
        {
            request.context[key] = value;
        }

        /// <summary>
        /// Add rarity context for special events
        /// </summary>
        public static void AddRarityContext(DialogueRequest request, string rarity)
        {
            request.context["rarity"] = rarity;
        }

        /// <summary>
        /// Add first-time flag
        /// </summary>
        public static void AddFirstTimeContext(DialogueRequest request, bool isFirstTime)
        {
            request.context["is_first_time"] = isFirstTime;
        }

        /// <summary>
        /// Add win streak context
        /// </summary>
        public static void AddWinStreakContext(DialogueRequest request, int streak)
        {
            request.context["win_streak"] = streak;
        }

        /// <summary>
        /// Add difficulty context
        /// </summary>
        public static void AddDifficultyContext(DialogueRequest request, string difficulty)
        {
            request.context["difficulty"] = difficulty;
        }

        #endregion
    }
}
