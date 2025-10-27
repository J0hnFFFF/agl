using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace AGL.SDK.Utils
{
    /// <summary>
    /// HTTP client for REST API calls
    /// </summary>
    public class HttpClient
    {
        private readonly string baseUrl;
        private readonly int timeout;
        private readonly bool enableDebugLogs;

        public HttpClient(string baseUrl, int timeout = 30, bool enableDebugLogs = true)
        {
            this.baseUrl = baseUrl.TrimEnd('/');
            this.timeout = timeout;
            this.enableDebugLogs = enableDebugLogs;
        }

        /// <summary>
        /// Send GET request
        /// </summary>
        public IEnumerator Get<T>(string endpoint, Action<T> onSuccess, Action<string> onError)
        {
            string url = $"{baseUrl}/{endpoint.TrimStart('/')}";

            if (enableDebugLogs)
                Debug.Log($"[AGL HTTP] GET {url}");

            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.timeout = timeout;
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        T response = JsonConvert.DeserializeObject<T>(request.downloadHandler.text);
                        if (enableDebugLogs)
                            Debug.Log($"[AGL HTTP] GET Success: {request.downloadHandler.text}");
                        onSuccess?.Invoke(response);
                    }
                    catch (Exception e)
                    {
                        string error = $"Failed to parse response: {e.Message}";
                        Debug.LogError($"[AGL HTTP] {error}");
                        onError?.Invoke(error);
                    }
                }
                else
                {
                    string error = $"Request failed: {request.error}";
                    Debug.LogError($"[AGL HTTP] {error}");
                    onError?.Invoke(error);
                }
            }
        }

        /// <summary>
        /// Send POST request
        /// </summary>
        public IEnumerator Post<TRequest, TResponse>(
            string endpoint,
            TRequest data,
            Action<TResponse> onSuccess,
            Action<string> onError)
        {
            string url = $"{baseUrl}/{endpoint.TrimStart('/')}";

            if (enableDebugLogs)
                Debug.Log($"[AGL HTTP] POST {url}");

            string jsonData = JsonConvert.SerializeObject(data);
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);

            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = timeout;
                request.SetRequestHeader("Content-Type", "application/json");

                if (enableDebugLogs)
                    Debug.Log($"[AGL HTTP] POST Body: {jsonData}");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        TResponse response = JsonConvert.DeserializeObject<TResponse>(request.downloadHandler.text);
                        if (enableDebugLogs)
                            Debug.Log($"[AGL HTTP] POST Success: {request.downloadHandler.text}");
                        onSuccess?.Invoke(response);
                    }
                    catch (Exception e)
                    {
                        string error = $"Failed to parse response: {e.Message}";
                        Debug.LogError($"[AGL HTTP] {error}");
                        onError?.Invoke(error);
                    }
                }
                else
                {
                    string error = $"Request failed: {request.error}";
                    Debug.LogError($"[AGL HTTP] {error}");
                    onError?.Invoke(error);
                }
            }
        }

        /// <summary>
        /// Send DELETE request
        /// </summary>
        public IEnumerator Delete(string endpoint, Action onSuccess, Action<string> onError)
        {
            string url = $"{baseUrl}/{endpoint.TrimStart('/')}";

            if (enableDebugLogs)
                Debug.Log($"[AGL HTTP] DELETE {url}");

            using (UnityWebRequest request = UnityWebRequest.Delete(url))
            {
                request.timeout = timeout;
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    if (enableDebugLogs)
                        Debug.Log($"[AGL HTTP] DELETE Success");
                    onSuccess?.Invoke();
                }
                else
                {
                    string error = $"Request failed: {request.error}";
                    Debug.LogError($"[AGL HTTP] {error}");
                    onError?.Invoke(error);
                }
            }
        }
    }
}
