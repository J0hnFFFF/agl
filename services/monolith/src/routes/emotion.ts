/**
 * Emotion Analysis Routes
 */

import { Router } from 'express';
import { getCache } from '../cache';
import { analyzeWithRules } from '../services/emotion-analyzer';

export const emotionRouter = Router();

emotionRouter.post('/analyze', async (req, res) => {
  try {
    const { eventType, data, context } = req.body;

    if (!eventType) {
      return res.status(400).json({
        error: 'eventType is required'
      });
    }

    // Check cache
    const cache = getCache();
    const cacheKey = `emotion:${eventType}:${JSON.stringify(data)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...(cached as any),
        cached: true
      });
    }

    // Analyze with rule engine
    const result = analyzeWithRules(eventType, data, context);

    // Cache result
    cache.set(cacheKey, result, 1800); // 30 minutes

    res.json({
      ...result,
      cached: false
    });
  } catch (error: any) {
    console.error('Emotion analysis error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

emotionRouter.get('/stats', (req, res) => {
  const cache = getCache();
  const stats = cache.getStats();

  res.json({
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    }
  });
});
