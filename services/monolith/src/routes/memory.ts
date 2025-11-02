/**
 * Memory Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDatabase } from '../db';

export const memoryRouter = Router();

memoryRouter.post('/store', (req, res) => {
  try {
    const { playerId, type, content, emotion, importance = 0.5, context } = req.body;

    if (!playerId || !content) {
      return res.status(400).json({
        error: 'playerId and content are required'
      });
    }

    const db = getDatabase();
    const id = nanoid();

    const stmt = db.prepare(`
      INSERT INTO memories (id, player_id, type, content, emotion, importance, context)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      playerId,
      type || 'event',
      content,
      emotion,
      importance,
      context ? JSON.stringify(context) : null
    );

    res.json({
      id,
      success: true,
      playerId,
      importance
    });
  } catch (error: any) {
    console.error('Memory store error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

memoryRouter.get('/search', (req, res) => {
  try {
    const { playerId, limit = 10, minImportance = 0 } = req.query;

    if (!playerId) {
      return res.status(400).json({
        error: 'playerId is required'
      });
    }

    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM memories
      WHERE player_id = ? AND importance >= ?
      ORDER BY importance DESC, created_at DESC
      LIMIT ?
    `);

    const memories = stmt.all(playerId, minImportance, limit);

    // Parse context JSON
    const parsed = memories.map((m: any) => ({
      ...m,
      context: m.context ? JSON.parse(m.context) : null
    }));

    res.json({
      memories: parsed,
      count: parsed.length
    });
  } catch (error: any) {
    console.error('Memory search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

memoryRouter.get('/:playerId/recent', (req, res) => {
  try {
    const { playerId } = req.params;
    const { limit = 5 } = req.query;

    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM memories
      WHERE player_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const memories = stmt.all(playerId, limit);

    const parsed = memories.map((m: any) => ({
      ...m,
      context: m.context ? JSON.parse(m.context) : null
    }));

    res.json({
      memories: parsed,
      count: parsed.length
    });
  } catch (error: any) {
    console.error('Memory recent error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
