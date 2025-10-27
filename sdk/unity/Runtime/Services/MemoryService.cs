using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using AGL.SDK.Core;
using AGL.SDK.Models;
using AGL.SDK.Utils;

namespace AGL.SDK.Services
{
    /// <summary>
    /// Client for Memory Service
    /// Manages player memories and context retrieval
    /// </summary>
    public class MemoryService
    {
        private readonly HttpClient httpClient;
        private readonly AGLConfig config;

        public MemoryService(AGLConfig config)
        {
            this.config = config;
            this.httpClient = new HttpClient(
                config.MemoryServiceUrl,
                config.RequestTimeout,
                config.EnableDebugLogs
            );
        }

        /// <summary>
        /// Create a new memory for player
        /// </summary>
        public IEnumerator CreateMemory(
            string playerId,
            CreateMemoryRequest request,
            Action<Memory> onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories";
            yield return httpClient.Post<CreateMemoryRequest, Memory>(
                endpoint,
                request,
                onSuccess,
                onError
            );
        }

        /// <summary>
        /// Create memory with simplified parameters
        /// </summary>
        public IEnumerator Create(
            string playerId,
            MemoryType type,
            string content,
            string emotion,
            Action<Memory> onSuccess,
            Action<string> onError)
        {
            var request = new CreateMemoryRequest(type, content, emotion);
            yield return CreateMemory(playerId, request, onSuccess, onError);
        }

        /// <summary>
        /// Get all memories for player
        /// </summary>
        public IEnumerator GetMemories(
            string playerId,
            Action<List<Memory>> onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories";
            yield return httpClient.Get<List<Memory>>(endpoint, onSuccess, onError);
        }

        /// <summary>
        /// Get context-relevant memories
        /// </summary>
        public IEnumerator GetContextMemories(
            string playerId,
            ContextRequest request,
            Action<List<Memory>> onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/context";
            yield return httpClient.Post<ContextRequest, List<Memory>>(
                endpoint,
                request,
                onSuccess,
                onError
            );
        }

        /// <summary>
        /// Search memories by query
        /// </summary>
        public IEnumerator SearchMemories(
            string playerId,
            SearchRequest request,
            Action<List<SearchResult>> onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories/search";
            yield return httpClient.Post<SearchRequest, List<SearchResult>>(
                endpoint,
                request,
                onSuccess,
                onError
            );
        }

        /// <summary>
        /// Search with simplified parameters
        /// </summary>
        public IEnumerator Search(
            string playerId,
            string query,
            int limit,
            Action<List<SearchResult>> onSuccess,
            Action<string> onError)
        {
            var request = new SearchRequest(query, limit);
            yield return SearchMemories(playerId, request, onSuccess, onError);
        }

        /// <summary>
        /// Delete a specific memory
        /// </summary>
        public IEnumerator DeleteMemory(
            string playerId,
            string memoryId,
            Action onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories/{memoryId}";
            yield return httpClient.Delete(endpoint, onSuccess, onError);
        }

        /// <summary>
        /// Delete all memories for player
        /// </summary>
        public IEnumerator DeleteAllMemories(
            string playerId,
            Action onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories";
            yield return httpClient.Delete(endpoint, onSuccess, onError);
        }

        /// <summary>
        /// Cleanup old/low-importance memories
        /// </summary>
        public IEnumerator CleanupMemories(
            string playerId,
            float minImportance,
            Action<object> onSuccess,
            Action<string> onError)
        {
            string endpoint = $"players/{playerId}/memories/cleanup?minImportance={minImportance}";
            yield return httpClient.Post<object, object>(endpoint, new { }, onSuccess, onError);
        }

        /// <summary>
        /// Get memory service health
        /// </summary>
        public IEnumerator GetHealth(Action<object> onSuccess, Action<string> onError)
        {
            yield return httpClient.Get<object>("health", onSuccess, onError);
        }

        #region Helper Methods

        /// <summary>
        /// Add context to memory request
        /// </summary>
        public static void AddContext(CreateMemoryRequest request, string key, object value)
        {
            request.context[key] = value;
        }

        /// <summary>
        /// Set importance score
        /// </summary>
        public static void SetImportance(CreateMemoryRequest request, float importance)
        {
            request.importance = Mathf.Clamp01(importance);
        }

        #endregion
    }
}
