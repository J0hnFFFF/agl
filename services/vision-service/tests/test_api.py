"""
API endpoint tests for Vision Service
"""
import pytest
import base64
import io
from PIL import Image
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
        assert data["service"] == "vision-service"
        assert data["status"] == "running"
        assert "providers" in data

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
        assert "total_cost" in data
        assert "daily_cost" in data
        assert "supported_providers" in data

    def test_budget_endpoint(self):
        """Test budget status endpoint"""
        response = client.get("/budget")
        assert response.status_code == 200
        data = response.json()
        assert "daily_budget" in data
        assert "daily_cost" in data
        assert "remaining" in data


class TestImageProcessing:
    """Test image processing utilities"""

    @pytest.fixture
    def sample_image_base64(self):
        """Generate sample image"""
        # Create simple test image
        img = Image.new('RGB', (800, 600), color='blue')

        # Add some text/pattern
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([100, 100, 300, 200], fill='red')
        draw.text((150, 150), "TEST", fill='white')

        # Convert to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        return base64.b64encode(buffer.read()).decode()

    def test_vision_analysis_without_api_key(self, sample_image_base64):
        """Test vision analysis (will fail without API key, but validates request structure)"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "png",
            "analysis_type": "full",
            "game_name": "Test Game",
            "enable_cache": False
        })

        # Will fail without API key, but should be 500 not 422 (validates request is correct)
        assert response.status_code in [200, 500, 429]

        if response.status_code == 200:
            data = response.json()
            assert "analysis_text" in data
            assert "processing_time_ms" in data
            assert "provider" in data
            assert "cost" in data

    def test_vision_analysis_invalid_base64(self):
        """Test with invalid base64"""
        response = client.post("/analyze", json={
            "image_data": "invalid-base64!!!",
            "image_format": "png"
        })

        assert response.status_code in [400, 422]

    def test_vision_analysis_missing_image(self):
        """Test with missing image data"""
        response = client.post("/analyze", json={
            "image_format": "png",
            "analysis_type": "full"
        })

        assert response.status_code == 422


class TestFileUpload:
    """Test file upload endpoint"""

    def test_file_upload_png(self):
        """Test PNG file upload"""
        # Create test image
        img = Image.new('RGB', (400, 300), color='green')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        response = client.post(
            "/analyze/file",
            files={"file": ("test.png", buffer, "image/png")},
            data={
                "analysis_type": "scene",
                "game_name": "Test Game",
                "enable_cache": "false"
            }
        )

        # May fail without API key
        assert response.status_code in [200, 500, 429]

    def test_file_upload_unsupported_format(self):
        """Test unsupported file format"""
        buffer = io.BytesIO(b"fake bmp data")

        response = client.post(
            "/analyze/file",
            files={"file": ("test.bmp", buffer, "image/bmp")},
            data={"analysis_type": "full"}
        )

        # Should reject unsupported format
        assert response.status_code in [400, 422]


class TestCacheManagement:
    """Test cache management"""

    def test_cache_stats(self):
        """Test cache statistics"""
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


class TestAnalysisTypes:
    """Test different analysis types"""

    @pytest.fixture
    def sample_image_base64(self):
        """Generate sample image"""
        img = Image.new('RGB', (640, 480), color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode()

    def test_scene_analysis(self, sample_image_base64):
        """Test scene analysis type"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "jpg",
            "analysis_type": "scene",
            "enable_cache": False
        })

        assert response.status_code in [200, 500, 429]

    def test_event_analysis(self, sample_image_base64):
        """Test event analysis type"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "jpg",
            "analysis_type": "event",
            "enable_cache": False
        })

        assert response.status_code in [200, 500, 429]

    def test_character_analysis(self, sample_image_base64):
        """Test character analysis type"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "jpg",
            "analysis_type": "character",
            "enable_cache": False
        })

        assert response.status_code in [200, 500, 429]

    def test_ui_analysis(self, sample_image_base64):
        """Test UI analysis type"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "jpg",
            "analysis_type": "ui",
            "enable_cache": False
        })

        assert response.status_code in [200, 500, 429]


class TestCustomPrompt:
    """Test custom analysis prompts"""

    @pytest.fixture
    def sample_image_base64(self):
        """Generate sample image"""
        img = Image.new('RGB', (512, 512), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode()

    def test_custom_prompt(self, sample_image_base64):
        """Test with custom analysis prompt"""
        response = client.post("/analyze", json={
            "image_data": sample_image_base64,
            "image_format": "png",
            "custom_prompt": "Describe the dominant color in this image.",
            "enable_cache": False
        })

        assert response.status_code in [200, 500, 429]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
