/**
 * AGL Monolith Service
 * All-in-one service with SQLite database
 *
 * Features:
 * - Express API server
 * - Socket.IO realtime
 * - SQLite database
 * - In-memory cache (replaces Redis)
 * - Emotion analysis
 * - Dialogue generation
 * - Memory management
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDatabase } from './db';
import { createCache } from './cache';
import { emotionRouter } from './routes/emotion';
import { dialogueRouter } from './routes/dialogue';
import { memoryRouter } from './routes/memory';
import { gameRouter } from './routes/game';
import { playerRouter } from './routes/player';
import { setupWebSocket } from './websocket';

// Load environment variables
dotenv.config({ path: '../../.env' });

const PORT = parseInt(process.env.MONOLITH_PORT || '3000', 10);
const HOST = process.env.MONOLITH_HOST || '0.0.0.0';

async function startServer() {
  // Initialize database
  console.log('📦 Initializing SQLite database...');
  initDatabase();
  const db = getDatabase();
  console.log('✅ Database ready');

  // Initialize cache
  console.log('💾 Initializing cache...');
  const cache = createCache();
  console.log('✅ Cache ready');

  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AGL Monolith',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'SQLite',
      cache: 'In-Memory'
    });
  });

  // API Routes
  app.use('/api/emotion', emotionRouter);
  app.use('/api/dialogue', dialogueRouter);
  app.use('/api/memory', memoryRouter);
  app.use('/api/games', gameRouter);
  app.use('/api/players', playerRouter);

  // WebSocket server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  setupWebSocket(io, db, cache);

  // Start server
  httpServer.listen(PORT, HOST, () => {
    console.log('');
    console.log('🚀 AGL Monolith Service Started!');
    console.log('');
    console.log(`📡 HTTP Server: http://${HOST}:${PORT}`);
    console.log(`🔌 WebSocket: ws://${HOST}:${PORT}`);
    console.log(`🗄️  Database: SQLite (agl.db)`);
    console.log(`💾 Cache: In-Memory`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  - GET  /health');
    console.log('  - POST /api/emotion/analyze');
    console.log('  - POST /api/dialogue/generate');
    console.log('  - POST /api/memory/store');
    console.log('  - GET  /api/memory/search');
    console.log('  - POST /api/games');
    console.log('  - GET  /api/games/:id');
    console.log('  - POST /api/players');
    console.log('');
    console.log('Press Ctrl+C to stop');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      db.close();
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
