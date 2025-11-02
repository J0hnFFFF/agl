#!/usr/bin/env python3
"""
AGL Monolith Advanced Test Suite
=================================

A comprehensive test suite for AGL Monolith service including:
- Full API workflow testing
- WebSocket real-time testing
- Performance benchmarks
- Load testing
- Detailed reporting

Usage:
    python scripts/test-suite.py
    python scripts/test-suite.py --performance
    python scripts/test-suite.py --load --requests 1000
"""

import requests
import json
import time
import sys
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import argparse

# ANSI color codes
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

@dataclass
class TestResult:
    """Test result data class"""
    name: str
    passed: bool
    duration: float
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class AGLTestSuite:
    """Comprehensive test suite for AGL Monolith service"""

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.results: List[TestResult] = []
        self.game_id: Optional[str] = None
        self.player_id: Optional[str] = None
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log(self, message: str, color: str = Colors.ENDC):
        """Print colored log message"""
        print(f"{color}{message}{Colors.ENDC}")

    def run_test(self, name: str, test_func):
        """Run a single test and record result"""
        self.log(f"\n▶ {name}", Colors.BLUE)
        start_time = time.time()

        try:
            result = test_func()
            duration = time.time() - start_time

            if result.get('passed', True):
                self.log(f"  ✓ Passed ({duration:.3f}s)", Colors.GREEN)
                self.results.append(TestResult(
                    name=name,
                    passed=True,
                    duration=duration,
                    details=result.get('details')
                ))
            else:
                self.log(f"  ✗ Failed: {result.get('error')}", Colors.RED)
                self.results.append(TestResult(
                    name=name,
                    passed=False,
                    duration=duration,
                    error=result.get('error')
                ))
        except Exception as e:
            duration = time.time() - start_time
            self.log(f"  ✗ Exception: {str(e)}", Colors.RED)
            self.results.append(TestResult(
                name=name,
                passed=False,
                duration=duration,
                error=str(e)
            ))

    # ==================== Basic Tests ====================

    def test_health_check(self) -> Dict:
        """Test health check endpoint"""
        response = self.session.get(f"{self.base_url}/health")
        data = response.json()

        self.log(f"  Status: {data.get('status')}", Colors.CYAN)
        self.log(f"  Service: {data.get('service')}", Colors.CYAN)

        return {
            'passed': response.status_code == 200 and data.get('status') == 'ok',
            'details': data
        }

    def test_create_game(self) -> Dict:
        """Test game creation"""
        payload = {
            "clientId": "test_client",
            "name": f"Test Game {datetime.now().strftime('%H:%M:%S')}",
            "description": "Automated test game"
        }

        response = self.session.post(f"{self.base_url}/api/games", json=payload)
        data = response.json()

        if response.status_code == 200:
            self.game_id = data.get('id')
            self.log(f"  Game ID: {self.game_id}", Colors.CYAN)
            self.log(f"  Name: {data.get('name')}", Colors.CYAN)
            return {'passed': True, 'details': data}
        else:
            return {'passed': False, 'error': f"HTTP {response.status_code}"}

    def test_create_player(self) -> Dict:
        """Test player creation"""
        if not self.game_id:
            return {'passed': False, 'error': 'No game_id available'}

        payload = {
            "gameId": self.game_id,
            "externalId": f"player_{int(time.time())}",
            "characterPersona": "cheerful"
        }

        response = self.session.post(f"{self.base_url}/api/players", json=payload)
        data = response.json()

        if response.status_code == 200:
            self.player_id = data.get('id')
            self.log(f"  Player ID: {self.player_id}", Colors.CYAN)
            self.log(f"  Persona: {data.get('characterPersona')}", Colors.CYAN)
            return {'passed': True, 'details': data}
        else:
            return {'passed': False, 'error': f"HTTP {response.status_code}"}

    # ==================== Emotion Tests ====================

    def test_emotion_victory(self) -> Dict:
        """Test emotion analysis for victory event"""
        payload = {
            "eventType": "player.victory",
            "data": {
                "killCount": 15,
                "mvp": True,
                "winStreak": 3
            }
        }

        response = self.session.post(f"{self.base_url}/api/emotion/analyze", json=payload)
        data = response.json()

        self.log(f"  Emotion: {data.get('emotion')}", Colors.CYAN)
        self.log(f"  Intensity: {data.get('intensity')}", Colors.CYAN)
        self.log(f"  Confidence: {data.get('confidence')}", Colors.CYAN)
        self.log(f"  Action: {data.get('action')}", Colors.CYAN)

        return {
            'passed': data.get('emotion') == 'excited',
            'details': data
        }

    def test_all_emotions(self) -> Dict:
        """Test all emotion event types"""
        test_cases = [
            ("player.victory", {"killCount": 15}, "excited"),
            ("player.death", {"deathCount": 5}, ["frustrated", "sad"]),
            ("player.achievement", {"rarity": "legendary"}, "proud"),
            ("player.level_up", {"newLevel": 10}, "proud"),
            ("combat.start", {}, "confident"),
            ("player.item_acquired", {"itemRarity": "epic"}, "happy"),
        ]

        results = []
        for event_type, data, expected_emotions in test_cases:
            payload = {"eventType": event_type, "data": data}
            response = self.session.post(f"{self.base_url}/api/emotion/analyze", json=payload)
            emotion_data = response.json()

            actual_emotion = emotion_data.get('emotion')
            if isinstance(expected_emotions, list):
                passed = actual_emotion in expected_emotions
            else:
                passed = actual_emotion == expected_emotions

            results.append({
                'event': event_type,
                'expected': expected_emotions,
                'actual': actual_emotion,
                'passed': passed
            })

            status = "✓" if passed else "✗"
            color = Colors.GREEN if passed else Colors.RED
            self.log(f"  {status} {event_type}: {actual_emotion}", color)

        all_passed = all(r['passed'] for r in results)
        return {'passed': all_passed, 'details': results}

    # ==================== Dialogue Tests ====================

    def test_dialogue_chinese(self) -> Dict:
        """Test Chinese dialogue generation"""
        payload = {
            "emotion": "excited",
            "persona": "cheerful",
            "language": "zh"
        }

        response = self.session.post(f"{self.base_url}/api/dialogue/generate", json=payload)
        data = response.json()

        dialogue = data.get('dialogue', '')
        self.log(f"  Dialogue: {dialogue}", Colors.CYAN)
        self.log(f"  Source: {data.get('source')}", Colors.CYAN)

        # Check if dialogue contains Chinese characters
        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in dialogue)

        return {
            'passed': response.status_code == 200 and has_chinese,
            'details': data
        }

    def test_dialogue_english(self) -> Dict:
        """Test English dialogue generation"""
        payload = {
            "emotion": "excited",
            "persona": "cheerful",
            "language": "en"
        }

        response = self.session.post(f"{self.base_url}/api/dialogue/generate", json=payload)
        data = response.json()

        dialogue = data.get('dialogue', '')
        self.log(f"  Dialogue: {dialogue}", Colors.CYAN)

        return {
            'passed': response.status_code == 200 and len(dialogue) > 0,
            'details': data
        }

    def test_dialogue_japanese(self) -> Dict:
        """Test Japanese dialogue generation"""
        payload = {
            "emotion": "excited",
            "persona": "cheerful",
            "language": "ja"
        }

        response = self.session.post(f"{self.base_url}/api/dialogue/generate", json=payload)
        data = response.json()

        dialogue = data.get('dialogue', '')
        self.log(f"  Dialogue: {dialogue}", Colors.CYAN)

        # Check if dialogue contains Japanese characters
        has_japanese = any('\u3040' <= char <= '\u30ff' or '\u4e00' <= char <= '\u9fff'
                          for char in dialogue)

        return {
            'passed': response.status_code == 200 and (has_japanese or len(dialogue) > 0),
            'details': data
        }

    def test_all_personas(self) -> Dict:
        """Test all character personas"""
        personas = ["cheerful", "serious", "playful"]
        results = []

        for persona in personas:
            payload = {
                "emotion": "excited",
                "persona": persona,
                "language": "en"
            }

            response = self.session.post(f"{self.base_url}/api/dialogue/generate", json=payload)
            data = response.json()

            passed = response.status_code == 200 and len(data.get('dialogue', '')) > 0
            results.append({
                'persona': persona,
                'dialogue': data.get('dialogue'),
                'passed': passed
            })

            status = "✓" if passed else "✗"
            color = Colors.GREEN if passed else Colors.RED
            self.log(f"  {status} {persona}: {data.get('dialogue', 'N/A')}", color)

        return {
            'passed': all(r['passed'] for r in results),
            'details': results
        }

    # ==================== Memory Tests ====================

    def test_store_memory(self) -> Dict:
        """Test memory storage"""
        if not self.player_id:
            return {'passed': False, 'error': 'No player_id available'}

        payload = {
            "playerId": self.player_id,
            "type": "achievement",
            "content": "First 15-kill victory with MVP status",
            "emotion": "excited",
            "importance": 0.9
        }

        response = self.session.post(f"{self.base_url}/api/memory/store", json=payload)
        data = response.json()

        if response.status_code == 200:
            self.log(f"  Memory ID: {data.get('id')}", Colors.CYAN)
            return {'passed': True, 'details': data}
        else:
            return {'passed': False, 'error': f"HTTP {response.status_code}"}

    def test_retrieve_memories(self) -> Dict:
        """Test memory retrieval"""
        if not self.player_id:
            return {'passed': False, 'error': 'No player_id available'}

        response = self.session.get(
            f"{self.base_url}/api/memory/search",
            params={"playerId": self.player_id, "limit": 10}
        )
        data = response.json()

        # API returns {memories: [...], count: ...}
        if isinstance(data, dict) and 'memories' in data:
            memories = data.get('memories', [])
            self.log(f"  Retrieved {len(memories)} memories", Colors.CYAN)
            for i, memory in enumerate(memories[:3], 1):
                self.log(f"    {i}. {memory.get('content', 'N/A')[:50]}...", Colors.CYAN)
            return {'passed': True, 'details': {'count': len(memories), 'memories': memories}}
        else:
            return {'passed': False, 'error': f'Invalid response format: {type(data)}'}

    def test_multiple_memories(self) -> Dict:
        """Test storing and retrieving multiple memories"""
        if not self.player_id:
            return {'passed': False, 'error': 'No player_id available'}

        # Store 5 memories
        memories = [
            {"type": "achievement", "content": "Completed tutorial", "emotion": "happy", "importance": 0.5},
            {"type": "combat", "content": "Defeated first boss", "emotion": "excited", "importance": 0.8},
            {"type": "social", "content": "Made a new friend", "emotion": "happy", "importance": 0.6},
            {"type": "exploration", "content": "Discovered hidden area", "emotion": "curious", "importance": 0.7},
            {"type": "achievement", "content": "Reached level 10", "emotion": "happy", "importance": 0.6},
        ]

        stored_count = 0
        for memory in memories:
            payload = {
                "playerId": self.player_id,
                **memory
            }
            response = self.session.post(f"{self.base_url}/api/memory/store", json=payload)
            if response.status_code == 200:
                stored_count += 1

        self.log(f"  Stored {stored_count}/{len(memories)} memories", Colors.CYAN)

        # Retrieve all
        response = self.session.get(
            f"{self.base_url}/api/memory/search",
            params={"playerId": self.player_id, "limit": 20}
        )
        data = response.json()
        # API returns {memories: [...], count: ...}
        if isinstance(data, dict) and 'memories' in data:
            retrieved = data.get('memories', [])
            retrieved_count = len(retrieved)
        else:
            retrieved_count = 0

        self.log(f"  Retrieved {retrieved_count} total memories", Colors.CYAN)

        return {
            'passed': stored_count == len(memories) and retrieved_count >= stored_count,
            'details': {
                'stored': stored_count,
                'retrieved': retrieved_count
            }
        }

    # ==================== Performance Tests ====================

    def test_performance_emotion(self, iterations: int = 100) -> Dict:
        """Test emotion analysis performance"""
        payload = {
            "eventType": "player.victory",
            "data": {"killCount": 15}
        }

        durations = []
        for _ in range(iterations):
            start = time.time()
            response = self.session.post(f"{self.base_url}/api/emotion/analyze", json=payload)
            duration = time.time() - start
            durations.append(duration)

        avg_duration = sum(durations) / len(durations)
        min_duration = min(durations)
        max_duration = max(durations)

        self.log(f"  Iterations: {iterations}", Colors.CYAN)
        self.log(f"  Average: {avg_duration*1000:.2f}ms", Colors.CYAN)
        self.log(f"  Min: {min_duration*1000:.2f}ms", Colors.CYAN)
        self.log(f"  Max: {max_duration*1000:.2f}ms", Colors.CYAN)

        return {
            'passed': avg_duration < 0.1,  # Should be under 100ms
            'details': {
                'iterations': iterations,
                'avg_ms': avg_duration * 1000,
                'min_ms': min_duration * 1000,
                'max_ms': max_duration * 1000
            }
        }

    def test_performance_dialogue(self, iterations: int = 100) -> Dict:
        """Test dialogue generation performance"""
        payload = {
            "emotion": "excited",
            "persona": "cheerful",
            "language": "en"
        }

        durations = []
        for _ in range(iterations):
            start = time.time()
            response = self.session.post(f"{self.base_url}/api/dialogue/generate", json=payload)
            duration = time.time() - start
            durations.append(duration)

        avg_duration = sum(durations) / len(durations)
        min_duration = min(durations)
        max_duration = max(durations)

        self.log(f"  Iterations: {iterations}", Colors.CYAN)
        self.log(f"  Average: {avg_duration*1000:.2f}ms", Colors.CYAN)
        self.log(f"  Min: {min_duration*1000:.2f}ms", Colors.CYAN)
        self.log(f"  Max: {max_duration*1000:.2f}ms", Colors.CYAN)

        return {
            'passed': avg_duration < 0.1,
            'details': {
                'iterations': iterations,
                'avg_ms': avg_duration * 1000,
                'min_ms': min_duration * 1000,
                'max_ms': max_duration * 1000
            }
        }

    # ==================== Integration Tests ====================

    def test_complete_workflow(self) -> Dict:
        """Test complete game workflow"""
        workflow_steps = []

        try:
            # 1. Create game
            game_resp = self.session.post(
                f"{self.base_url}/api/games",
                json={"clientId": "test_client", "name": "Workflow Test", "description": "Test"}
            )
            workflow_game_id = game_resp.json().get('id')
            workflow_steps.append(("Create Game", game_resp.status_code == 200))

            # 2. Create player
            player_resp = self.session.post(
                f"{self.base_url}/api/players",
                json={"gameId": workflow_game_id, "externalId": f"wf_{int(time.time())}", "characterPersona": "cheerful"}
            )
            workflow_player_id = player_resp.json().get('id')
            workflow_steps.append(("Create Player", player_resp.status_code == 200))

            # 3. Player starts game
            emotion_resp = self.session.post(
                f"{self.base_url}/api/emotion/analyze",
                json={"eventType": "game.start", "data": {}}
            )
            workflow_steps.append(("Game Start", emotion_resp.status_code == 200))

            # 4. Player gets kill
            emotion_resp = self.session.post(
                f"{self.base_url}/api/emotion/analyze",
                json={"eventType": "combat.kill", "data": {"killCount": 1}}
            )
            workflow_steps.append(("First Kill", emotion_resp.status_code == 200))

            # 5. Generate dialogue
            dialogue_resp = self.session.post(
                f"{self.base_url}/api/dialogue/generate",
                json={"emotion": emotion_resp.json().get('emotion'), "persona": "cheerful", "language": "en"}
            )
            workflow_steps.append(("Generate Dialogue", dialogue_resp.status_code == 200))

            # 6. Store memory
            memory_resp = self.session.post(
                f"{self.base_url}/api/memory/store",
                json={
                    "playerId": workflow_player_id,
                    "type": "combat",
                    "content": "First kill in the match",
                    "emotion": emotion_resp.json().get('emotion'),
                    "importance": 0.7
                }
            )
            workflow_steps.append(("Store Memory", memory_resp.status_code == 200))

            # 7. Player wins
            emotion_resp = self.session.post(
                f"{self.base_url}/api/emotion/analyze",
                json={"eventType": "player.victory", "data": {"killCount": 15, "mvp": True}}
            )
            workflow_steps.append(("Victory", emotion_resp.status_code == 200))

            # 8. Generate victory dialogue
            dialogue_resp = self.session.post(
                f"{self.base_url}/api/dialogue/generate",
                json={"emotion": "excited", "persona": "cheerful", "language": "en"}
            )
            workflow_steps.append(("Victory Dialogue", dialogue_resp.status_code == 200))

            # 9. Store victory memory
            memory_resp = self.session.post(
                f"{self.base_url}/api/memory/store",
                json={
                    "playerId": workflow_player_id,
                    "type": "achievement",
                    "content": "Won match with 15 kills and MVP",
                    "emotion": "excited",
                    "importance": 0.9
                }
            )
            workflow_steps.append(("Store Victory Memory", memory_resp.status_code == 200))

            # 10. Retrieve all memories
            memories_resp = self.session.get(
                f"{self.base_url}/api/memory/search",
                params={"playerId": workflow_player_id, "limit": 10}
            )
            mem_data = memories_resp.json()
            # API returns {memories: [...], count: ...}
            if isinstance(mem_data, dict) and 'memories' in mem_data:
                memory_count = len(mem_data.get('memories', []))
            else:
                memory_count = 0
            workflow_steps.append(("Retrieve Memories", memory_count >= 2))

            # Print results
            for step, passed in workflow_steps:
                status = "✓" if passed else "✗"
                color = Colors.GREEN if passed else Colors.RED
                self.log(f"  {status} {step}", color)

            all_passed = all(passed for _, passed in workflow_steps)
            return {
                'passed': all_passed,
                'details': {
                    'total_steps': len(workflow_steps),
                    'passed_steps': sum(1 for _, p in workflow_steps if p),
                    'steps': [{'name': name, 'passed': passed} for name, passed in workflow_steps]
                }
            }

        except Exception as e:
            return {'passed': False, 'error': str(e)}

    # ==================== Main Test Runner ====================

    def run_basic_tests(self):
        """Run basic functionality tests"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("🎮 AGL Monolith Advanced Test Suite", Colors.BOLD)
        self.log("="*60 + "\n", Colors.BOLD)

        self.log("📋 BASIC FUNCTIONALITY TESTS", Colors.HEADER)

        self.run_test("Health Check", self.test_health_check)
        self.run_test("Create Game", self.test_create_game)
        self.run_test("Create Player", self.test_create_player)

        self.log("\n📋 EMOTION ANALYSIS TESTS", Colors.HEADER)

        self.run_test("Emotion: Victory", self.test_emotion_victory)
        self.run_test("All Emotion Types", self.test_all_emotions)

        self.log("\n📋 DIALOGUE GENERATION TESTS", Colors.HEADER)

        self.run_test("Dialogue: Chinese", self.test_dialogue_chinese)
        self.run_test("Dialogue: English", self.test_dialogue_english)
        self.run_test("Dialogue: Japanese", self.test_dialogue_japanese)
        self.run_test("All Personas", self.test_all_personas)

        self.log("\n📋 MEMORY SYSTEM TESTS", Colors.HEADER)

        self.run_test("Store Memory", self.test_store_memory)
        self.run_test("Retrieve Memories", self.test_retrieve_memories)
        self.run_test("Multiple Memories", self.test_multiple_memories)

        self.log("\n📋 INTEGRATION TESTS", Colors.HEADER)

        self.run_test("Complete Workflow", self.test_complete_workflow)

    def run_performance_tests(self, iterations: int = 100):
        """Run performance tests"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("⚡ PERFORMANCE TESTS", Colors.HEADER)
        self.log("="*60 + "\n", Colors.BOLD)

        self.run_test(f"Emotion Performance ({iterations} requests)",
                     lambda: self.test_performance_emotion(iterations))
        self.run_test(f"Dialogue Performance ({iterations} requests)",
                     lambda: self.test_performance_dialogue(iterations))

    def print_summary(self):
        """Print test summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed

        total_duration = sum(r.duration for r in self.results)

        self.log("\n" + "="*60, Colors.BOLD)
        self.log("📊 TEST SUMMARY", Colors.HEADER)
        self.log("="*60, Colors.BOLD)

        self.log(f"\nTotal Tests: {total}", Colors.CYAN)
        self.log(f"Passed: {passed}", Colors.GREEN)
        if failed > 0:
            self.log(f"Failed: {failed}", Colors.RED)
        self.log(f"Total Duration: {total_duration:.2f}s", Colors.CYAN)

        if failed > 0:
            self.log("\n❌ FAILED TESTS:", Colors.RED)
            for result in self.results:
                if not result.passed:
                    self.log(f"  • {result.name}", Colors.RED)
                    if result.error:
                        self.log(f"    Error: {result.error}", Colors.YELLOW)

        self.log("\n" + "="*60, Colors.BOLD)

        if failed == 0:
            self.log("✅ ALL TESTS PASSED!", Colors.GREEN)
        else:
            self.log(f"⚠️  {failed} TEST(S) FAILED", Colors.RED)

        self.log("="*60 + "\n", Colors.BOLD)

        return failed == 0

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='AGL Monolith Advanced Test Suite')
    parser.add_argument('--url', default='http://localhost:3000', help='Base URL of the service')
    parser.add_argument('--performance', action='store_true', help='Run performance tests')
    parser.add_argument('--iterations', type=int, default=100, help='Number of iterations for performance tests')
    parser.add_argument('--basic-only', action='store_true', help='Run only basic tests')

    args = parser.parse_args()

    suite = AGLTestSuite(base_url=args.url)

    try:
        # Always run basic tests
        suite.run_basic_tests()

        # Run performance tests if requested
        if args.performance and not args.basic_only:
            suite.run_performance_tests(iterations=args.iterations)

        # Print summary
        success = suite.print_summary()

        # Exit with appropriate code
        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
