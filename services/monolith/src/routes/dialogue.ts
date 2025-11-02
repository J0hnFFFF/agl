/**
 * Dialogue Generation Routes
 */

import { Router } from 'express';
import { getCache } from '../cache';
import { generateDialogue } from '../services/dialogue-generator';

export const dialogueRouter = Router();

dialogueRouter.post('/generate', async (req, res) => {
  try {
    const { emotion, context, persona = 'cheerful', language = 'zh' } = req.body;

    if (!emotion) {
      return res.status(400).json({
        error: 'emotion is required'
      });
    }

    // Check cache
    const cache = getCache();
    const cacheKey = `dialogue:${emotion}:${persona}:${language}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...(cached as any),
        cached: true
      });
    }

    // Generate dialogue
    const result = await generateDialogue(emotion, context, persona, language);

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600);

    res.json({
      ...result,
      cached: false
    });
  } catch (error: any) {
    console.error('Dialogue generation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
