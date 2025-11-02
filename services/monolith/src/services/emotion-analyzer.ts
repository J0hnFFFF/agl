/**
 * Simple Rule-Based Emotion Analyzer
 */

interface EmotionResult {
  emotion: string;
  intensity: number;
  confidence: number;
  action: string;
  method: 'rule';
}

export function analyzeWithRules(
  eventType: string,
  data: any = {},
  context: any = {}
): EmotionResult {
  // Victory events
  if (eventType === 'player.victory' || eventType === 'match.won') {
    const kills = data.killCount || data.kills || 0;
    const mvp = data.mvp || data.isMVP || false;

    if (mvp || kills >= 15) {
      return {
        emotion: 'excited',
        intensity: 0.9,
        confidence: 0.95,
        action: 'celebrate',
        method: 'rule'
      };
    }

    return {
      emotion: 'happy',
      intensity: 0.7,
      confidence: 0.9,
      action: 'cheer',
      method: 'rule'
    };
  }

  // Defeat events
  if (eventType === 'player.defeat' || eventType === 'match.lost') {
    const consecutiveLosses = context.consecutiveLosses || 0;

    if (consecutiveLosses >= 3) {
      return {
        emotion: 'frustrated',
        intensity: 0.8,
        confidence: 0.9,
        action: 'comfort',
        method: 'rule'
      };
    }

    return {
      emotion: 'disappointed',
      intensity: 0.6,
      confidence: 0.85,
      action: 'encourage',
      method: 'rule'
    };
  }

  // Death events
  if (eventType === 'player.death' || eventType === 'player.killed') {
    const consecutiveDeaths = context.consecutiveDeaths || 0;

    if (consecutiveDeaths >= 3) {
      return {
        emotion: 'frustrated',
        intensity: 0.7,
        confidence: 0.85,
        action: 'comfort',
        method: 'rule'
      };
    }

    return {
      emotion: 'sad',
      intensity: 0.5,
      confidence: 0.8,
      action: 'sympathize',
      method: 'rule'
    };
  }

  // Kill events
  if (eventType === 'player.kill' || eventType === 'enemy.killed') {
    const isMultiKill = data.multiKill || false;
    const killStreak = data.killStreak || 0;

    if (isMultiKill || killStreak >= 5) {
      return {
        emotion: 'excited',
        intensity: 0.8,
        confidence: 0.9,
        action: 'celebrate',
        method: 'rule'
      };
    }

    return {
      emotion: 'proud',
      intensity: 0.6,
      confidence: 0.85,
      action: 'praise',
      method: 'rule'
    };
  }

  // Achievement events
  if (eventType === 'achievement.unlocked' || eventType === 'player.levelup') {
    return {
      emotion: 'proud',
      intensity: 0.8,
      confidence: 0.95,
      action: 'celebrate',
      method: 'rule'
    };
  }

  // Combat events
  if (eventType === 'combat.start' || eventType === 'enemy.engaged') {
    return {
      emotion: 'confident',
      intensity: 0.7,
      confidence: 0.8,
      action: 'focus',
      method: 'rule'
    };
  }

  // Low health
  if (eventType === 'player.lowhp' || eventType === 'health.critical') {
    return {
      emotion: 'fearful',
      intensity: 0.7,
      confidence: 0.9,
      action: 'warn',
      method: 'rule'
    };
  }

  // Default: neutral
  return {
    emotion: 'neutral',
    intensity: 0.5,
    confidence: 0.6,
    action: 'observe',
    method: 'rule'
  };
}
