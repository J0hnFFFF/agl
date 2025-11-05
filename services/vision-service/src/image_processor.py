"""
Image processing and optimization
"""
import io
import base64
import hashlib
from typing import Tuple, Optional
from PIL import Image
import logging

from .config import settings

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Process and optimize images for vision analysis"""

    def __init__(self):
        """Initialize image processor"""
        self.max_size = settings.max_image_size
        self.compression_quality = settings.compression_quality

    def process_image(
        self,
        image_data: bytes,
        optimize: bool = True
    ) -> Tuple[bytes, dict]:
        """
        Process image: validate, optimize, return processed data

        Args:
            image_data: Raw image bytes
            optimize: Whether to optimize image

        Returns:
            Tuple of (processed_bytes, metadata)
        """
        # Load image
        image = Image.open(io.BytesIO(image_data))

        # Get original metadata
        original_size = image.size
        original_format = image.format
        original_bytes = len(image_data)

        metadata = {
            'original_width': original_size[0],
            'original_height': original_size[1],
            'original_format': original_format,
            'original_size_bytes': original_bytes,
            'optimized': False
        }

        # Convert to RGB if needed (remove alpha channel)
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background

        # Optimize if requested
        if optimize and settings.enable_image_optimization:
            image, was_optimized = self._optimize_image(image)
            metadata['optimized'] = was_optimized

        # Convert back to bytes
        output_buffer = io.BytesIO()
        image.save(
            output_buffer,
            format='JPEG',
            quality=self.compression_quality,
            optimize=True
        )
        processed_bytes = output_buffer.getvalue()

        # Update metadata
        metadata['final_width'] = image.size[0]
        metadata['final_height'] = image.size[1]
        metadata['final_size_bytes'] = len(processed_bytes)
        metadata['compression_ratio'] = (
            1 - len(processed_bytes) / original_bytes
        ) * 100 if original_bytes > 0 else 0

        logger.info(
            f"Processed image: {original_size} -> {image.size}, "
            f"{original_bytes} -> {len(processed_bytes)} bytes "
            f"({metadata['compression_ratio']:.1f}% reduction)"
        )

        return processed_bytes, metadata

    def _optimize_image(self, image: Image.Image) -> Tuple[Image.Image, bool]:
        """
        Optimize image for cost savings

        - Resize if too large
        - Reduce quality while maintaining readability

        Returns:
            Tuple of (optimized_image, was_optimized)
        """
        was_optimized = False

        # Check if resize needed
        width, height = image.size
        max_dimension = max(width, height)

        if max_dimension > settings.auto_resize_threshold:
            # Calculate new size maintaining aspect ratio
            scale_factor = settings.auto_resize_threshold / max_dimension
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)

            # Resize with high-quality resampling
            image = image.resize(
                (new_width, new_height),
                Image.Resampling.LANCZOS
            )

            was_optimized = True
            logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")

        return image, was_optimized

    def encode_image_to_base64(self, image_data: bytes) -> str:
        """Encode image bytes to base64 string"""
        return base64.b64encode(image_data).decode('utf-8')

    def decode_image_from_base64(self, base64_string: str) -> bytes:
        """Decode base64 string to image bytes"""
        return base64.b64decode(base64_string)

    def calculate_image_hash(self, image_data: bytes) -> str:
        """
        Calculate hash of image for deduplication

        Args:
            image_data: Image bytes

        Returns:
            SHA256 hash (first 16 characters)
        """
        return hashlib.sha256(image_data).hexdigest()[:16]

    def get_image_info(self, image_data: bytes) -> dict:
        """
        Get image information without processing

        Args:
            image_data: Image bytes

        Returns:
            Dictionary with image info
        """
        try:
            image = Image.open(io.BytesIO(image_data))

            return {
                'width': image.size[0],
                'height': image.size[1],
                'format': image.format,
                'mode': image.mode,
                'size_bytes': len(image_data)
            }
        except Exception as e:
            logger.error(f"Failed to get image info: {e}")
            return {}

    def validate_image(self, image_data: bytes) -> bool:
        """
        Validate image data

        Args:
            image_data: Image bytes

        Returns:
            True if valid, False otherwise
        """
        try:
            image = Image.open(io.BytesIO(image_data))
            image.verify()
            return True
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False

    def create_thumbnail(
        self,
        image_data: bytes,
        max_size: int = 256
    ) -> bytes:
        """
        Create thumbnail of image

        Args:
            image_data: Image bytes
            max_size: Max width/height

        Returns:
            Thumbnail bytes
        """
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if needed
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background

        # Create thumbnail
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        # Convert to bytes
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='JPEG', quality=80)

        return output_buffer.getvalue()


# Global instance
image_processor = ImageProcessor()
