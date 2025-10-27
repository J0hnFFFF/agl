import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = parseInt(process.env.REALTIME_GATEWAY_PORT || '3001');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const API_SERVICE_URL = process.env.API_SERVICE_URL || 'http://localhost:3000';

/**
 * Verify API key with the API service
 * @param apiKey - The API key to verify
 * @returns Promise<boolean> - True if valid, false otherwise
 */
async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // For now, we check if the API service is reachable
    // In production, implement a dedicated /auth/verify endpoint
    if (response.ok) {
      return true;
    }

    // Log verification failure for debugging
    console.warn(`⚠️  API key verification failed: ${response.status} ${response.statusText}`);
    return false;
  } catch (error) {
    console.error('❌ Error verifying API key:', error);
    // In case of network errors, reject the connection for security
    return false;
  }
}

async function bootstrap() {
  // Create Socket.IO server
  const io = new Server(PORT, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for horizontal scaling
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  console.log('✅ Redis adapter connected');

  // Middleware: Authentication
  io.use(async (socket, next) => {
    const apiKey = socket.handshake.auth.apiKey;
    const playerId = socket.handshake.auth.playerId;

    if (!apiKey || !playerId) {
      return next(new Error('Authentication required: missing apiKey or playerId'));
    }

    // Verify API key with API service
    const isValid = await verifyApiKey(apiKey);

    if (!isValid) {
      console.warn(`⚠️  Authentication failed for player ${playerId}`);
      return next(new Error('Invalid API key'));
    }

    // Store authenticated data
    socket.data.apiKey = apiKey;
    socket.data.playerId = playerId;

    console.log(`✅ Authenticated: ${playerId}`);
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    const playerId = socket.data.playerId;
    console.log(`✅ Player connected: ${playerId}`);

    // Join player's personal room
    socket.join(`player:${playerId}`);

    // Handle game events from client
    socket.on('game_event', async (event) => {
      console.log(`📥 Game event from ${playerId}:`, event.type);

      // Publish to Redis for processing by AI services
      await pubClient.publish(
        'game_events',
        JSON.stringify({
          playerId,
          apiKey: socket.data.apiKey,
          event,
          timestamp: Date.now(),
        })
      );

      // Acknowledge receipt
      socket.emit('event_ack', { eventId: event.id || Date.now() });
    });

    // Handle player chat messages
    socket.on('chat_message', async (message) => {
      console.log(`💬 Chat from ${playerId}:`, message);

      // Publish for dialogue generation
      await pubClient.publish(
        'chat_messages',
        JSON.stringify({
          playerId,
          message,
          timestamp: Date.now(),
        })
      );
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`👋 Player disconnected: ${playerId} (${reason})`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AGL Realtime Gateway',
      playerId,
      timestamp: Date.now(),
    });
  });

  // Subscribe to AI responses and broadcast to clients
  const responseSubscriber = createClient({ url: REDIS_URL });
  await responseSubscriber.connect();

  await responseSubscriber.subscribe('ai_responses', (message) => {
    try {
      const response = JSON.parse(message);
      const { playerId, emotion, dialogue, action } = response;

      // Send to specific player
      io.to(`player:${playerId}`).emit('companion_action', {
        emotion,
        dialogue,
        action,
        timestamp: Date.now(),
      });

      console.log(`📤 Sent companion action to ${playerId}`);
    } catch (error) {
      console.error('❌ Error processing AI response:', error);
    }
  });

  console.log(`🚀 Realtime Gateway running on port ${PORT}`);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Start server
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
