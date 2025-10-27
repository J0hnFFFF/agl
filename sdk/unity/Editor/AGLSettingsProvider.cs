using UnityEditor;
using UnityEngine;
using AGL.SDK.Core;

namespace AGL.SDK.Editor
{
    /// <summary>
    /// Unity Editor settings provider for AGL SDK
    /// </summary>
    public class AGLSettingsProvider : SettingsProvider
    {
        private const string SettingsPath = "Project/AGL SDK";
        private SerializedObject serializedConfig;
        private AGLConfig config;

        public AGLSettingsProvider(string path, SettingsScope scope = SettingsScope.Project)
            : base(path, scope) { }

        public override void OnActivate(string searchContext, UnityEngine.UIElements.VisualElement rootElement)
        {
            // Load or create config
            config = LoadOrCreateConfig();
            serializedConfig = new SerializedObject(config);
        }

        public override void OnGUI(string searchContext)
        {
            if (serializedConfig == null) return;

            serializedConfig.Update();

            GUILayout.Label("AGL Companion SDK Settings", EditorStyles.boldLabel);
            GUILayout.Space(10);

            // API Configuration
            GUILayout.Label("API Configuration", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Configure your AGL API endpoints and credentials.",
                MessageType.Info
            );

            EditorGUILayout.PropertyField(serializedConfig.FindProperty("apiKey"));
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("apiBaseUrl"));
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("realtimeUrl"));

            GUILayout.Space(10);

            // Service URLs
            GUILayout.Label("Service URLs", EditorStyles.boldLabel);
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("emotionServiceUrl"));
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("dialogueServiceUrl"));
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("memoryServiceUrl"));

            GUILayout.Space(10);

            // Advanced Settings
            GUILayout.Label("Advanced Settings", EditorStyles.boldLabel);
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("enableDebugLogs"));
            EditorGUILayout.PropertyField(serializedConfig.FindProperty("requestTimeout"));

            GUILayout.Space(20);

            // Validation
            if (GUILayout.Button("Validate Configuration", GUILayout.Height(30)))
            {
                if (config.IsValid(out string error))
                {
                    EditorUtility.DisplayDialog("Success", "Configuration is valid!", "OK");
                }
                else
                {
                    EditorUtility.DisplayDialog("Validation Error", error, "OK");
                }
            }

            serializedConfig.ApplyModifiedProperties();
        }

        [SettingsProvider]
        public static SettingsProvider CreateAGLSettingsProvider()
        {
            var provider = new AGLSettingsProvider(SettingsPath, SettingsScope.Project)
            {
                keywords = new System.Collections.Generic.HashSet<string>(new[] {
                    "AGL", "Companion", "AI", "Emotion", "Dialogue", "Memory"
                })
            };

            return provider;
        }

        private AGLConfig LoadOrCreateConfig()
        {
            // Try to load existing config from Resources
            var existing = Resources.Load<ScriptableObject>("AGLConfig");
            if (existing != null)
            {
                return existing as AGLConfig;
            }

            // Create new config
            return AGLConfig.CreateDefault();
        }
    }
}
