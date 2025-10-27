/**
 * AGL Web SDK - Node.js Example
 *
 * Demonstrates using the SDK in a Node.js environment
 * for server-side game logic or backend integration.
 */

const AGLClient = require('../dist/index.js').default;
const { AGLHelpers } = require('../dist/index.js');

// Initialize the SDK
const agl = new AGLClient({
  apiKey: process.env.AGL_API_KEY || 'your-api-key',
  apiBaseUrl: process.env.AGL_API_URL || 'http://localhost:3000',
  emotionServiceUrl: process.env.AGL_EMOTION_URL || 'http://localhost:8000',
  dialogueServiceUrl: process.env.AGL_DIALOGUE_URL || 'http://localhost:8001',
  memoryServiceUrl: process.env.AGL_MEMORY_URL || 'http://localhost:3002',
  timeout: 10000,
});

// Example 1: Handle player match completion
async function handleMatchComplete(playerId, matchData) {
  console.log('\n=== Match Complete ===');
  console.log('Player:', playerId);
  console.log('Match Data:', matchData);

  agl.setPlayerId(playerId);
  agl.setGameId('demo-game');

  try {
    // Determine event type
    const eventType = matchData.won ? 'player.victory' : 'player.defeat';

    // Create emotion request
    const emotionRequest = {
      type: eventType,
      data: {
        mvp: matchData.mvp || false,
        winStreak: matchData.winStreak || 0,
        lossStreak: matchData.lossStreak || 0,
      },
      context: {
        playerHealth: matchData.finalHealth,
        playerLevel: matchData.playerLevel,
        inCombat: false,
      },
    };

    // Analyze emotion
    const emotionResult = await agl.emotion.analyze(emotionRequest);
    console.log('\nEmotion Analysis:');
    console.log(`  Emotion: ${emotionResult.emotion}`);
    console.log(`  Intensity: ${(emotionResult.intensity * 100).toFixed(1)}%`);
    console.log(`  Method: ${emotionResult.method}`);
    console.log(`  Cost: $${emotionResult.cost.toFixed(6)}`);
    console.log(`  Latency: ${emotionResult.latency_ms}ms`);

    // Generate dialogue
    const dialogueResult = await agl.dialogue.generate({
      event_type: eventType,
      emotion: emotionResult.emotion,
      persona: 'cheerful',
      player_id: playerId,
      context: {
        matchDuration: matchData.duration,
        performance: matchData.performance,
      },
    });

    console.log('\nDialogue Generated:');
    console.log(`  Text: "${dialogueResult.dialogue}"`);
    console.log(`  Method: ${dialogueResult.method}`);
    console.log(`  Memories Used: ${dialogueResult.memory_count}`);
    console.log(`  Cost: $${dialogueResult.cost.toFixed(6)}`);

    // Create memory for significant events
    if (matchData.won && (matchData.mvp || matchData.winStreak >= 3)) {
      const memory = await agl.memory.create(playerId, {
        type: 'achievement',
        content: `${matchData.mvp ? 'MVP ' : ''}victory with ${matchData.winStreak} win streak`,
        emotion: emotionResult.emotion,
        importance: matchData.mvp ? 9 : 7,
        context: {
          matchId: matchData.matchId,
          timestamp: new Date().toISOString(),
          stats: matchData.stats,
        },
      });

      console.log('\nMemory Created:');
      console.log(`  ID: ${memory.id}`);
      console.log(`  Type: ${memory.type}`);
      console.log(`  Importance: ${memory.importance}/10`);
    }

    return {
      emotion: emotionResult,
      dialogue: dialogueResult,
    };

  } catch (error) {
    console.error('Error handling match complete:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

// Example 2: Generate personalized greeting using memories
async function generatePersonalizedGreeting(playerId) {
  console.log('\n=== Personalized Greeting ===');
  console.log('Player:', playerId);

  agl.setPlayerId(playerId);

  try {
    // Search for recent significant memories
    const memories = await agl.memory.search(playerId, {
      query: 'achievement victory milestone',
      limit: 3,
    });

    console.log(`\nFound ${memories.length} relevant memories`);

    let context = {};
    if (memories.length > 0) {
      console.log('Recent achievements:');
      memories.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.memory.content} (score: ${result.similarityScore.toFixed(2)})`);
      });

      context = {
        recentAchievements: memories.map(r => r.memory.content),
        lastEmotion: memories[0].memory.emotion,
      };
    }

    // Generate greeting
    const greeting = await agl.dialogue.generate({
      event_type: 'player.sessionstart',
      emotion: 'cheerful',
      persona: 'cheerful',
      player_id: playerId,
      context,
    });

    console.log('\nGreeting:');
    console.log(`  "${greeting.dialogue}"`);

    return greeting.dialogue;

  } catch (error) {
    console.error('Error generating greeting:', error.message);
    throw error;
  }
}

// Example 3: Batch process multiple achievements
async function processAchievements(playerId, achievements) {
  console.log('\n=== Processing Achievements ===');
  console.log('Player:', playerId);
  console.log('Achievements:', achievements.length);

  agl.setPlayerId(playerId);

  try {
    const results = [];

    for (const achievement of achievements) {
      console.log(`\nProcessing: ${achievement.name} (${achievement.rarity})`);

      // Use helper to create request
      const emotionRequest = AGLHelpers.createAchievementRequest(achievement.rarity);
      emotionRequest.data.achievementId = achievement.id;
      emotionRequest.data.achievementName = achievement.name;

      const emotion = await agl.emotion.analyze(emotionRequest);

      const dialogue = await agl.dialogue.generate({
        event_type: 'player.achievement',
        emotion: emotion.emotion,
        persona: 'cute',
        player_id: playerId,
        context: {
          achievementName: achievement.name,
          rarity: achievement.rarity,
        },
      });

      // Create memory
      const memory = await agl.memory.create(playerId, {
        type: 'achievement',
        content: `Unlocked: ${achievement.name}`,
        emotion: emotion.emotion,
        importance: achievement.rarity === 'legendary' ? 10 :
                   achievement.rarity === 'epic' ? 7 : 5,
        context: {
          achievementId: achievement.id,
          rarity: achievement.rarity,
        },
      });

      results.push({
        achievement,
        emotion: emotion.emotion,
        dialogue: dialogue.dialogue,
        memoryId: memory.id,
      });

      console.log(`  Emotion: ${emotion.emotion}`);
      console.log(`  Dialogue: "${dialogue.dialogue}"`);
    }

    return results;

  } catch (error) {
    console.error('Error processing achievements:', error.message);
    throw error;
  }
}

// Example 4: Get player analytics
async function getPlayerAnalytics(playerId) {
  console.log('\n=== Player Analytics ===');
  console.log('Player:', playerId);

  agl.setPlayerId(playerId);

  try {
    // Get all memories
    const allMemories = await agl.memory.get(playerId, 50);

    console.log(`\nTotal memories: ${allMemories.length}`);

    // Analyze memory distribution
    const byType = allMemories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {});

    console.log('\nMemory distribution:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Analyze emotions
    const byEmotion = allMemories
      .filter(m => m.emotion)
      .reduce((acc, memory) => {
        acc[memory.emotion] = (acc[memory.emotion] || 0) + 1;
        return acc;
      }, {});

    console.log('\nEmotion distribution:');
    Object.entries(byEmotion).forEach(([emotion, count]) => {
      console.log(`  ${emotion}: ${count}`);
    });

    // Calculate average importance
    const avgImportance = allMemories.reduce((sum, m) => sum + m.importance, 0) / allMemories.length;
    console.log(`\nAverage importance: ${avgImportance.toFixed(2)}/10`);

    // Get high-importance memories
    const importantMemories = allMemories.filter(m => m.importance >= 8);
    console.log(`\nHigh-importance memories (8+): ${importantMemories.length}`);
    importantMemories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.content} (${memory.importance}/10)`);
    });

    return {
      totalMemories: allMemories.length,
      byType,
      byEmotion,
      avgImportance,
      importantMemories,
    };

  } catch (error) {
    console.error('Error getting analytics:', error.message);
    throw error;
  }
}

// Run examples
async function main() {
  console.log('AGL Web SDK - Node.js Examples\n');
  console.log('='.repeat(50));

  try {
    // Example 1: Match completion
    await handleMatchComplete('player-123', {
      matchId: 'match-001',
      won: true,
      mvp: true,
      winStreak: 5,
      finalHealth: 100,
      playerLevel: 15,
      duration: 1200, // seconds
      performance: 'excellent',
      stats: {
        kills: 12,
        deaths: 2,
        assists: 8,
      },
    });

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example 2: Personalized greeting
    await generatePersonalizedGreeting('player-123');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example 3: Batch achievements
    await processAchievements('player-123', [
      { id: 'ach-001', name: 'First Victory', rarity: 'common' },
      { id: 'ach-002', name: 'Win Streak Master', rarity: 'epic' },
      { id: 'ach-003', name: 'Legendary Champion', rarity: 'legendary' },
    ]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example 4: Analytics
    await getPlayerAnalytics('player-123');

    console.log('\n' + '='.repeat(50));
    console.log('All examples completed successfully!');

  } catch (error) {
    console.error('\nFailed to run examples:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  handleMatchComplete,
  generatePersonalizedGreeting,
  processAchievements,
  getPlayerAnalytics,
};
