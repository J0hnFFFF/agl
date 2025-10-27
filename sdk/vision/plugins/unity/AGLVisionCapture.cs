/**
 * AGL Vision Capture - Unity Plugin
 *
 * Place this file in Assets/Plugins/AGL/Vision/
 *
 * Usage:
 * 1. Attach this script to a GameObject in your scene
 * 2. Configure capture settings in the Unity Inspector
 * 3. Call StartCapture() to begin automatic screen capture
 * 4. JavaScript will receive screenshots via the CaptureScreen callback
 *
 * @author AGL Team
 * @version 0.1.0
 */

using UnityEngine;
using System;
using System.Runtime.InteropServices;
using System.Collections;

namespace AGL.Vision
{
    /// <summary>
    /// Captures Unity camera renders and sends them to JavaScript for vision analysis
    /// </summary>
    public class AGLVisionCapture : MonoBehaviour
    {
        #region Inspector Fields

        [Header("Capture Settings")]
        [Tooltip("Camera to capture from (defaults to Main Camera)")]
        public Camera captureCamera;

        [Tooltip("Capture resolution width")]
        [Range(640, 3840)]
        public int captureWidth = 1920;

        [Tooltip("Capture resolution height")]
        [Range(480, 2160)]
        public int captureHeight = 1080;

        [Tooltip("JPEG quality (1-100)")]
        [Range(1, 100)]
        public int jpegQuality = 80;

        [Tooltip("Capture interval in seconds")]
        [Range(0.1f, 10f)]
        public float captureInterval = 1.0f;

        [Header("Auto Capture")]
        [Tooltip("Start capturing automatically on Start()")]
        public bool autoStart = true;

        [Header("Debug")]
        [Tooltip("Log debug messages to console")]
        public bool enableDebug = false;

        #endregion

        #region JavaScript Interop

        /// <summary>
        /// JavaScript callback function for receiving screenshots
        /// Must be defined in your HTML/JavaScript:
        /// window.CaptureScreen = function(base64Data) { ... }
        /// </summary>
        [DllImport("__Internal")]
        private static extern void CaptureScreen(string base64Data);

        #endregion

        #region Private Fields

        private RenderTexture renderTexture;
        private Texture2D screenshot;
        private bool isCapturing = false;
        private Coroutine captureCoroutine;

        #endregion

        #region Unity Lifecycle

        void Start()
        {
            // Default to Main Camera if not set
            if (captureCamera == null)
            {
                captureCamera = Camera.main;
                if (captureCamera == null)
                {
                    Debug.LogError("[AGLVision] No camera found. Please assign a camera or tag one as MainCamera.");
                    enabled = false;
                    return;
                }
            }

            // Initialize textures
            InitializeTextures();

            if (autoStart)
            {
                StartCapture();
            }

            if (enableDebug)
            {
                Debug.Log($"[AGLVision] Initialized - Camera: {captureCamera.name}, Resolution: {captureWidth}x{captureHeight}");
            }
        }

        void OnDestroy()
        {
            StopCapture();
            CleanupTextures();
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Start automatic screen capture at the configured interval
        /// </summary>
        public void StartCapture()
        {
            if (isCapturing)
            {
                Debug.LogWarning("[AGLVision] Capture already running");
                return;
            }

            isCapturing = true;
            captureCoroutine = StartCoroutine(CaptureLoop());

            if (enableDebug)
            {
                Debug.Log($"[AGLVision] Started capture loop (interval: {captureInterval}s)");
            }
        }

        /// <summary>
        /// Stop automatic screen capture
        /// </summary>
        public void StopCapture()
        {
            if (!isCapturing)
            {
                return;
            }

            isCapturing = false;
            if (captureCoroutine != null)
            {
                StopCoroutine(captureCoroutine);
                captureCoroutine = null;
            }

            if (enableDebug)
            {
                Debug.Log("[AGLVision] Stopped capture loop");
            }
        }

        /// <summary>
        /// Capture a single screenshot immediately
        /// </summary>
        public void CaptureNow()
        {
            CaptureAndSend();
        }

        /// <summary>
        /// Check if capture is currently running
        /// </summary>
        public bool IsCapturing()
        {
            return isCapturing;
        }

        #endregion

        #region Private Methods

        /// <summary>
        /// Initialize render texture and screenshot texture
        /// </summary>
        private void InitializeTextures()
        {
            renderTexture = new RenderTexture(captureWidth, captureHeight, 24);
            renderTexture.antiAliasing = 1;
            screenshot = new Texture2D(captureWidth, captureHeight, TextureFormat.RGB24, false);
        }

        /// <summary>
        /// Cleanup textures to prevent memory leaks
        /// </summary>
        private void CleanupTextures()
        {
            if (renderTexture != null)
            {
                renderTexture.Release();
                Destroy(renderTexture);
                renderTexture = null;
            }

            if (screenshot != null)
            {
                Destroy(screenshot);
                screenshot = null;
            }
        }

        /// <summary>
        /// Coroutine that captures screenshots at regular intervals
        /// </summary>
        private IEnumerator CaptureLoop()
        {
            while (isCapturing)
            {
                CaptureAndSend();
                yield return new WaitForSeconds(captureInterval);
            }
        }

        /// <summary>
        /// Capture current camera view and send to JavaScript
        /// </summary>
        private void CaptureAndSend()
        {
            try
            {
                // Save current camera target
                RenderTexture previousTarget = captureCamera.targetTexture;

                // Render camera to our texture
                captureCamera.targetTexture = renderTexture;
                captureCamera.Render();

                // Read pixels from render texture
                RenderTexture.active = renderTexture;
                screenshot.ReadPixels(new Rect(0, 0, captureWidth, captureHeight), 0, 0);
                screenshot.Apply();

                // Restore camera target
                captureCamera.targetTexture = previousTarget;
                RenderTexture.active = null;

                // Convert to JPEG and Base64
                byte[] bytes = screenshot.EncodeToJPG(jpegQuality);
                string base64 = Convert.ToBase64String(bytes);

                // Send to JavaScript
                #if UNITY_WEBGL && !UNITY_EDITOR
                CaptureScreen(base64);
                #endif

                if (enableDebug)
                {
                    Debug.Log($"[AGLVision] Captured {bytes.Length} bytes ({base64.Length} base64 chars)");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[AGLVision] Capture error: {e.Message}");
            }
        }

        #endregion

        #region Editor Utilities

        #if UNITY_EDITOR
        /// <summary>
        /// Validate settings when changed in inspector
        /// </summary>
        void OnValidate()
        {
            // Ensure dimensions are even numbers (required by some video codecs)
            if (captureWidth % 2 != 0) captureWidth++;
            if (captureHeight % 2 != 0) captureHeight++;

            // Clamp values
            captureWidth = Mathf.Clamp(captureWidth, 640, 3840);
            captureHeight = Mathf.Clamp(captureHeight, 480, 2160);
            jpegQuality = Mathf.Clamp(jpegQuality, 1, 100);
            captureInterval = Mathf.Max(0.1f, captureInterval);
        }
        #endif

        #endregion
    }
}
