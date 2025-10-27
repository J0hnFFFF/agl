using System;
using System.Collections.Generic;

namespace AGL.SDK.Models
{
    /// <summary>
    /// Memory type
    /// </summary>
    public enum MemoryType
    {
        Achievement,
        Combat,
        Social,
        Exploration,
        Custom
    }

    /// <summary>
    /// Request to create a memory
    /// </summary>
    [Serializable]
    public class CreateMemoryRequest
    {
        public string type;
        public string content;
        public string emotion;
        public Dictionary<string, object> context;
        public float? importance;

        public CreateMemoryRequest(MemoryType type, string content, string emotion = null)
        {
            this.type = type.ToString().ToLower();
            this.content = content;
            this.emotion = emotion;
            context = new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// Memory response
    /// </summary>
    [Serializable]
    public class Memory
    {
        public string id;
        public string player_id;
        public string type;
        public string content;
        public string emotion;
        public Dictionary<string, object> context;
        public float importance;
        public string created_at;
        public string updated_at;

        public override string ToString()
        {
            return $"Memory: {content} (Type: {type}, Importance: {importance:F2})";
        }
    }

    /// <summary>
    /// Request for context-based memory search
    /// </summary>
    [Serializable]
    public class ContextRequest
    {
        public string current_event;
        public int limit;

        public ContextRequest(string currentEvent, int limit = 5)
        {
            current_event = currentEvent;
            this.limit = limit;
        }
    }

    /// <summary>
    /// Search request
    /// </summary>
    [Serializable]
    public class SearchRequest
    {
        public string query;
        public int limit;
        public float min_similarity;

        public SearchRequest(string query, int limit = 10, float minSimilarity = 0.7f)
        {
            this.query = query;
            this.limit = limit;
            min_similarity = minSimilarity;
        }
    }

    /// <summary>
    /// Search result
    /// </summary>
    [Serializable]
    public class SearchResult
    {
        public Memory memory;
        public float similarity_score;

        public override string ToString()
        {
            return $"{memory.content} (Similarity: {similarity_score:F2})";
        }
    }
}
