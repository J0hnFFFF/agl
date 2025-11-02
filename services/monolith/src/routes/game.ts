/**
 * Game Management Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDatabase } from '../db';

export const gameRouter = Router();

gameRouter.post('/', (req, res) => {
  try {
    const { clientId, name, description, config } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({
        error: 'clientId and name are required'
      });
    }

    const db = getDatabase();
    const id = nanoid();

    const stmt = db.prepare(`
      INSERT INTO games (id, client_id, name, description, config)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      clientId,
      name,
      description || null,
      config ? JSON.stringify(config) : null
    );

    res.json({
      id,
      clientId,
      name,
      description,
      config,
      success: true
    });
  } catch (error: any) {
    console.error('Game creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

gameRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
    const game = stmt.get(id);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found'
      });
    }

    res.json({
      ...(game as any),
      config: (game as any).config ? JSON.parse((game as any).config) : null
    });
  } catch (error: any) {
    console.error('Game fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
