using UnityEngine;
using AGL.SDK.Core;
using AGL.SDK.Models;

namespace AGL.SDK.Samples
{
    /// <summary>
    /// Basic example of using AGL SDK
    /// Demonstrates emotion analysis, dialogue generation, and memory creation
    /// </summary>
    public class BasicExample : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private AGLClient aglClient;
        [SerializeField] private string playerId = "player-123";
        [SerializeField] private Persona characterPersona = Persona.Cheerful;

        [Header("UI References (Optional)")]
        [SerializeField] private UnityEngine.UI.Text dialogueText;
        [SerializeField] private UnityEngine.UI.Text emotionText;

        private void Start()
        {
            // Initialize client
            if (aglClient == null)
            {
                aglClient = AGLClient.Instance;
            }

            // Set player ID
            aglClient.SetPlayerId(playerId);

            // Check service health
            aglClient.CheckHealth((report) =>
            {
                Debug.Log(report);
            });
        }

        #region Example: Player Victory

        public void OnPlayerVictory(bool isMVP = false, int winStreak = 0)
        {
            // 1. Analyze emotion
            var emotionRequest = EmotionService.CreateVictoryRequest(isMVP, winStreak);

            StartCoroutine(aglClient.Emotion.AnalyzeEmotion(
                emotionRequest,
                (emotionResponse) =>
                {
                    Debug.Log($"Emotion detected: {emotionResponse}");
                    UpdateEmotionUI(emotionResponse);

                    // 2. Generate dialogue based on emotion
                    var dialogueRequest = new DialogueRequest(
                        "player.victory",
                        emotionResponse.emotion,
                        characterPersona
                    );

                    // Add context for special dialogue
                    if (isMVP)
                    {
                        DialogueService.AddContext(dialogueRequest, "mvp", true);
                    }
                    if (winStreak > 0)
                    {
                        DialogueService.AddWinStreakContext(dialogueRequest, winStreak);
                    }

                    StartCoroutine(aglClient.Dialogue.GenerateDialogue(
                        dialogueRequest,
                        (dialogueResponse) =>
                        {
                            Debug.Log($"Dialogue generated: {dialogueResponse}");
                            UpdateDialogueUI(dialogueResponse);

                            // 3. Create memory of this victory
                            CreateVictoryMemory(isMVP, winStreak, emotionResponse.emotion);
                        },
                        (error) => Debug.LogError($"Dialogue error: {error}")
                    ));
                },
                (error) => Debug.LogError($"Emotion error: {error}")
            ));
        }

        #endregion

        #region Example: Legendary Achievement

        public void OnLegendaryAchievement(string achievementName)
        {
            // 1. Analyze emotion
            var emotionRequest = EmotionService.CreateAchievementRequest("legendary");

            StartCoroutine(aglClient.Emotion.AnalyzeEmotion(
                emotionRequest,
                (emotionResponse) =>
                {
                    Debug.Log($"Emotion: {emotionResponse}");

                    // 2. Generate dialogue with special context
                    var dialogueRequest = new DialogueRequest(
                        "player.achievement",
                        emotionResponse.emotion,
                        characterPersona
                    );
                    DialogueService.AddRarityContext(dialogueRequest, "legendary");
                    DialogueService.AddFirstTimeContext(dialogueRequest, true);

                    StartCoroutine(aglClient.Dialogue.GenerateDialogue(
                        dialogueRequest,
                        (dialogueResponse) =>
                        {
                            Debug.Log($"Dialogue: {dialogueResponse}");
                            UpdateDialogueUI(dialogueResponse);

                            // 3. Create important memory
                            CreateAchievementMemory(achievementName, emotionResponse.emotion);
                        },
                        (error) => Debug.LogError(error)
                    ));
                },
                (error) => Debug.LogError(error)
            ));
        }

        #endregion

        #region Memory Creation

        private void CreateVictoryMemory(bool isMVP, int winStreak, string emotion)
        {
            string content = isMVP ?
                $"Won the match as MVP with {winStreak} win streak" :
                $"Won the match with {winStreak} win streak";

            var memoryRequest = new CreateMemoryRequest(
                MemoryType.Combat,
                content,
                emotion
            );

            // Set higher importance for MVP victories
            if (isMVP)
            {
                MemoryService.SetImportance(memoryRequest, 0.9f);
            }

            StartCoroutine(aglClient.Memory.CreateMemory(
                playerId,
                memoryRequest,
                (memory) => Debug.Log($"Memory created: {memory}"),
                (error) => Debug.LogError($"Memory error: {error}")
            ));
        }

        private void CreateAchievementMemory(string achievementName, string emotion)
        {
            var memoryRequest = new CreateMemoryRequest(
                MemoryType.Achievement,
                $"Unlocked legendary achievement: {achievementName}",
                emotion
            );

            // Legendary achievements are very important
            MemoryService.SetImportance(memoryRequest, 1.0f);

            StartCoroutine(aglClient.Memory.CreateMemory(
                playerId,
                memoryRequest,
                (memory) => Debug.Log($"Achievement memory created: {memory}"),
                (error) => Debug.LogError(error)
            ));
        }

        #endregion

        #region Memory Search Example

        public void SearchPlayerMemories(string query)
        {
            StartCoroutine(aglClient.Memory.Search(
                playerId,
                query,
                5,
                (results) =>
                {
                    Debug.Log($"Found {results.Count} memories:");
                    foreach (var result in results)
                    {
                        Debug.Log($"  - {result}");
                    }
                },
                (error) => Debug.LogError(error)
            ));
        }

        #endregion

        #region UI Updates

        private void UpdateEmotionUI(EmotionResponse response)
        {
            if (emotionText != null)
            {
                emotionText.text = $"Emotion: {response.emotion} ({response.intensity:P0})";
            }
        }

        private void UpdateDialogueUI(DialogueResponse response)
        {
            if (dialogueText != null)
            {
                dialogueText.text = response.dialogue;
            }
        }

        #endregion

        #region Test Buttons (for Unity Inspector)

        [ContextMenu("Test Victory")]
        private void TestVictory()
        {
            OnPlayerVictory(true, 5);
        }

        [ContextMenu("Test Legendary Achievement")]
        private void TestLegendaryAchievement()
        {
            OnLegendaryAchievement("Dragon Slayer");
        }

        [ContextMenu("Test Search Memories")]
        private void TestSearchMemories()
        {
            SearchPlayerMemories("victory achievement");
        }

        #endregion
    }
}
