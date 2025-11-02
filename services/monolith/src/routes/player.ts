/**
 * Player Management Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDatabase } from '../db';

export const playerRouter = Router();

playerRouter.post('/', (req, res) => {
  try {
    const { gameId, externalId, characterPersona = 'cheerful', preferences } = req.body;

    if (!gameId || !externalId) {
      return res.status(400).json({
        error: 'gameId and externalId are required'
      });
    }

    const db = getDatabase();
    const id = nanoid();

    const stmt = db.prepare(`
      INSERT INTO players (id, game_id, external_id, character_persona, preferences)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      gameId,
      externalId,
      characterPersona,
      preferences ? JSON.stringify(preferences) : null
    );

    res.json({
      id,
      gameId,
      externalId,
      characterPersona,
      preferences,
      success: true
    });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Player already exists for this game and external ID'
      });
    }

    console.error('Player creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

playerRouter.get('/:gameId/:externalId', (req, res) => {
  try {
    const { gameId, externalId } = req.params;
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM players
      WHERE game_id = ? AND external_id = ?
    `);

    const player = stmt.get(gameId, externalId);

    if (!player) {
      return res.status(404).json({
        error: 'Player not found'
      });
    }

    res.json({
      ...(player as any),
      preferences: (player as any).preferences ? JSON.parse((player as any).preferences) : null
    });
  } catch (error: any) {
    console.error('Player fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
