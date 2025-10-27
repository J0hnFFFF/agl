using System;
using System.Collections.Generic;

namespace AGL.SDK.Models
{
    /// <summary>
    /// Character persona types
    /// </summary>
    public enum Persona
    {
        Cheerful,
        Cool,
        Cute
    }

    /// <summary>
    /// Request for dialogue generation
    /// </summary>
    [Serializable]
    public class DialogueRequest
    {
        public string event_type;
        public string emotion;
        public string persona;
        public string player_id;
        public string language;
        public Dictionary<string, object> context;
        public bool force_llm;

        public DialogueRequest(string eventType, string emotion, Persona persona, string language = "zh")
        {
            event_type = eventType;
            this.emotion = emotion;
            this.persona = persona.ToString().ToLower();
            this.language = language;
            context = new Dictionary<string, object>();
            force_llm = false;
        }
    }

    /// <summary>
    /// Response from dialogue generation
    /// </summary>
    [Serializable]
    public class DialogueResponse
    {
        public string dialogue;
        public string method;
        public float cost;
        public bool used_special_case;
        public List<string> special_case_reasons;
        public int memory_count;
        public bool cache_hit;
        public float latency_ms;

        public override string ToString()
        {
            return $"Dialogue: {dialogue} (Method: {method}, Cost: ${cost:F6})";
        }
    }

    /// <summary>
    /// Dialogue generation method
    /// </summary>
    public enum DialogueMethod
    {
        Template,
        LLM,
        Cached
    }
}
