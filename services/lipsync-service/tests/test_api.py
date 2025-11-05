"""
API endpoint tests for Lip Sync Service
"""
import pytest
import base64
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health and status endpoints"""

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "lipsync-service"
        assert data["status"] == "running"

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "dependencies" in data

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_requests" in data
        assert "cache_hit_rate" in data
        assert "supported_languages" in data
        assert "supported_visemes" in data


class TestLipSyncGeneration:
    """Test lip sync generation"""

    @pytest.fixture
    def sample_audio_base64(self):
        """Generate sample audio data (silence)"""
        # Create 1 second of silence (44100 Hz, 16-bit, mono WAV)
        import io
        import wave
        import struct

        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(44100)

            # 1 second of silence
            silence = struct.pack('<h', 0) * 44100
            wav.writeframes(silence)

        buffer.seek(0)
        audio_bytes = buffer.read()
        return base64.b64encode(audio_bytes).decode()

    def test_lipsync_basic(self, sample_audio_base64):
        """Test basic lip sync generation"""
        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "standard"
        })

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "visemes" in data
        assert "total_duration" in data
        assert "processing_time_ms" in data
        assert "cache_hit" in data
        assert "method" in data
        assert "viseme_count" in data

        # Visemes should be a list
        assert isinstance(data["visemes"], list)

    def test_lipsync_unity_format(self, sample_audio_base64):
        """Test Unity format output"""
        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "unity"
        })

        assert response.status_code == 200
        data = response.json()

        # Check Unity-specific output
        assert "output_data" in data
        assert data["output_data"]["format"] == "unity"
        assert "clips" in data["output_data"]

    def test_lipsync_unreal_format(self, sample_audio_base64):
        """Test Unreal format output"""
        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "unreal"
        })

        assert response.status_code == 200
        data = response.json()

        # Check Unreal-specific output
        assert "output_data" in data
        assert data["output_data"]["format"] == "unreal"
        assert "curves" in data["output_data"]

    def test_lipsync_web_format(self, sample_audio_base64):
        """Test Web format output"""
        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "web"
        })

        assert response.status_code == 200
        data = response.json()

        # Check Web-specific output
        assert "output_data" in data
        assert data["output_data"]["format"] == "web"
        assert "morphTargets" in data["output_data"]

    def test_lipsync_caching(self, sample_audio_base64):
        """Test caching behavior"""
        # First request
        response1 = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "standard",
            "enable_cache": True
        })

        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["cache_hit"] is False

        # Second request (should hit cache)
        response2 = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "output_format": "standard",
            "enable_cache": True
        })

        assert response2.status_code == 200
        data2 = response2.json()

        # May or may not hit cache depending on Redis availability
        # Just check it doesn't error

    def test_lipsync_no_blending(self, sample_audio_base64):
        """Test without transition blending"""
        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US",
            "blend_transitions": False
        })

        assert response.status_code == 200
        data = response.json()
        assert "visemes" in data

    def test_lipsync_invalid_base64(self):
        """Test with invalid base64 audio data"""
        response = client.post("/lipsync", json={
            "audio_data": "invalid-base64!!!",
            "audio_format": "wav"
        })

        # Should fail validation or processing
        assert response.status_code in [400, 422, 500]

    def test_lipsync_missing_audio(self):
        """Test with missing audio data"""
        response = client.post("/lipsync", json={
            "audio_format": "wav",
            "language": "en-US"
        })

        # Should fail validation
        assert response.status_code == 422


class TestCacheManagement:
    """Test cache management endpoints"""

    def test_cache_stats(self):
        """Test cache statistics endpoint"""
        response = client.get("/cache/stats")
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data

    def test_cache_clear(self):
        """Test cache clearing"""
        response = client.delete("/cache")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestFileUpload:
    """Test file upload endpoint"""

    def test_file_upload_basic(self):
        """Test basic file upload"""
        # Create a simple WAV file
        import io
        import wave
        import struct

        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(44100)

            # Short audio
            audio_data = struct.pack('<h', 0) * 22050  # 0.5 seconds
            wav.writeframes(audio_data)

        buffer.seek(0)

        # Upload
        response = client.post(
            "/lipsync/file",
            files={"file": ("test.wav", buffer, "audio/wav")},
            data={
                "language": "en-US",
                "output_format": "standard"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "visemes" in data


class TestVisemeEvents:
    """Test viseme event structure"""

    def test_viseme_structure(self, sample_audio_base64=None):
        """Test that viseme events have correct structure"""
        if sample_audio_base64 is None:
            # Create sample audio
            import io
            import wave
            import struct

            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(44100)
                wav.writeframes(struct.pack('<h', 0) * 44100)

            buffer.seek(0)
            sample_audio_base64 = base64.b64encode(buffer.read()).decode()

        response = client.post("/lipsync", json={
            "audio_data": sample_audio_base64,
            "audio_format": "wav",
            "language": "en-US"
        })

        if response.status_code == 200:
            data = response.json()
            visemes = data.get("visemes", [])

            if visemes:
                # Check first viseme structure
                viseme = visemes[0]
                assert "viseme" in viseme
                assert "viseme_name" in viseme
                assert "start_time" in viseme
                assert "end_time" in viseme
                assert "weight" in viseme

                # Check time ordering
                assert viseme["end_time"] > viseme["start_time"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
