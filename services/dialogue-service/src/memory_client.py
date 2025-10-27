"""
Memory Service Client
Fetches player memories for context
"""
import httpx
from typing import List, Optional
from .models import Memory
from .config import settings
import logging

logger = logging.getLogger(__name__)


class MemoryServiceClient:
    """Client for Memory Service API"""

    def __init__(self):
        self.base_url = settings.memory_service_url
        self.timeout = httpx.Timeout(5.0)  # 5 second timeout

    async def get_context_memories(
        self,
        player_id: str,
        current_event: str,
        limit: int = None
    ) -> List[Memory]:
        """
        Fetch contextual memories for dialogue generation

        Args:
            player_id: Player ID
            current_event: Current event description
            limit: Max number of memories (default from settings)

        Returns:
            List of relevant memories
        """
        if limit is None:
            limit = settings.max_memory_context

        url = f"{self.base_url}/players/{player_id}/context"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json={
                        "currentEvent": current_event,
                        "limit": limit
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return [Memory(**item) for item in data]
                else:
                    logger.warning(
                        f"Memory Service returned {response.status_code}: {response.text}"
                    )
                    return []

        except httpx.TimeoutException:
            logger.error(f"Memory Service timeout for player {player_id}")
            return []
        except httpx.HTTPError as e:
            logger.error(f"Memory Service HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching memories: {e}")
            return []

    async def check_health(self) -> bool:
        """Check if Memory Service is available"""
        url = f"{self.base_url}/health"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                return response.status_code == 200
        except:
            return False
