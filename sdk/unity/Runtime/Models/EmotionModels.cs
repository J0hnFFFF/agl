using System;
using System.Collections.Generic;

namespace AGL.SDK.Models
{
    /// <summary>
    /// Request for emotion analysis
    /// </summary>
    [Serializable]
    public class EmotionRequest
    {
        public string type;
        public Dictionary<string, object> data;
        public Dictionary<string, object> context;
        public bool force_ml;

        public EmotionRequest(string eventType)
        {
            type = eventType;
            data = new Dictionary<string, object>();
            context = new Dictionary<string, object>();
            force_ml = false;
        }
    }

    /// <summary>
    /// Response from emotion analysis
    /// </summary>
    [Serializable]
    public class EmotionResponse
    {
        public string emotion;
        public float intensity;
        public string action;
        public float confidence;
        public string reasoning;
        public string method;
        public float cost;
        public bool cache_hit;
        public float latency_ms;

        public override string ToString()
        {
            return $"Emotion: {emotion}, Intensity: {intensity:F2}, Action: {action}, Confidence: {confidence:F2}, Method: {method}";
        }
    }

    /// <summary>
    /// Supported emotion types
    /// </summary>
    public enum EmotionType
    {
        Happy,
        Excited,
        Amazed,
        Proud,
        Satisfied,
        Cheerful,
        Grateful,
        Sad,
        Disappointed,
        Frustrated,
        Angry,
        Worried,
        Tired,
        Neutral
    }

    /// <summary>
    /// Character actions mapped from emotions
    /// </summary>
    public enum CharacterAction
    {
        Smile,
        Cheer,
        SurprisedJump,
        ProudPose,
        Nod,
        Wave,
        Thank,
        Comfort,
        Sigh,
        Encourage,
        CalmDown,
        Concerned,
        Rest,
        Idle
    }
}
