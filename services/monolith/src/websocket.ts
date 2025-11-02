/**
 * WebSocket Setup
 */

import { Server as SocketIOServer } from 'socket.io';
import type Database from 'better-sqlite3';
import type NodeCache from 'node-cache';
import { analyzeWithRules } from './services/emotion-analyzer';
import { generateDialogue } from './services/dialogue-generator';

export function setupWebSocket(
  io: SocketIOServer,
  db: Database.Database,
  cache: NodeCache
) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join player room
    socket.on('join', (data) => {
      const { playerId } = data;
      if (playerId) {
        socket.join(`player:${playerId}`);
        console.log(`Player ${playerId} joined their room`);
      }
    });

    // Handle game events
    socket.on('game_event', async (event) => {
      try {
        const { playerId, eventType, data, context } = event;

        // Analyze emotion
        const emotion = analyzeWithRules(eventType, data, context);

        // Generate dialogue
        const dialogue = await generateDialogue(
          emotion.emotion,
          context,
          'cheerful',
          'zh'
        );

        // Send companion action
        socket.emit('companion_action', {
          emotion: emotion.emotion,
          intensity: emotion.intensity,
          dialogue: dialogue.dialogue,
          action: emotion.action
        });

        // Broadcast to player room
        if (playerId) {
          io.to(`player:${playerId}`).emit('companion_action', {
            emotion: emotion.emotion,
            intensity: emotion.intensity,
            dialogue: dialogue.dialogue,
            action: emotion.action
          });
        }

        console.log(`📤 Event processed: ${eventType} → ${emotion.emotion}`);
      } catch (error) {
        console.error('Event processing error:', error);
        socket.emit('error', {
          message: 'Failed to process game event'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ WebSocket server ready');
}
