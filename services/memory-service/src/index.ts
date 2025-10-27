import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { MemoryService } from './services/memory.service';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.MEMORY_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const prisma = new PrismaClient();
const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();
const memoryService = new MemoryService(prisma, qdrantService, embeddingService);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'memory-service',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Get player memories
app.get('/players/:playerId/memories', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { limit = '10', offset = '0', type } = req.query;

    const memories = await memoryService.getMemories(playerId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      type: type as string,
    });

    res.json(memories);
  } catch (error) {
    console.error('Error getting memories:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

// Search memories by semantic similarity
app.post('/players/:playerId/memories/search', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const memories = await memoryService.searchMemories(playerId, query, limit);

    res.json(memories);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

// Create a new memory
app.post('/players/:playerId/memories', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { type, content, emotion, context } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    const memory = await memoryService.createMemory(playerId, {
      type,
      content,
      emotion,
      context,
    });

    res.status(201).json(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Get contextual memories for dialogue generation
app.post('/players/:playerId/context', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { currentEvent, limit = 5 } = req.body;

    if (!currentEvent) {
      return res.status(400).json({ error: 'Current event is required' });
    }

    const context = await memoryService.getContextForDialogue(playerId, currentEvent, limit);

    res.json(context);
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: 'Failed to get context' });
  }
});

// Update memory importance
app.patch('/memories/:memoryId/importance', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const { importance } = req.body;

    if (importance === undefined || importance < 0 || importance > 1) {
      return res.status(400).json({ error: 'Importance must be between 0 and 1' });
    }

    const memory = await memoryService.updateImportance(memoryId, importance);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  } catch (error) {
    console.error('Error updating importance:', error);
    res.status(500).json({ error: 'Failed to update importance' });
  }
});

// Delete old/unimportant memories
app.delete('/players/:playerId/memories/cleanup', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { maxAge, minImportance = 0.3 } = req.query;

    const result = await memoryService.cleanupMemories(playerId, {
      maxAge: maxAge ? parseInt(maxAge as string, 10) : undefined,
      minImportance: parseFloat(minImportance as string),
    });

    res.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error cleaning up memories:', error);
    res.status(500).json({ error: 'Failed to cleanup memories' });
  }
});

// Initialize Qdrant collection on startup
async function initializeServices() {
  try {
    await qdrantService.initialize();
    console.log('✓ Qdrant service initialized');
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
initializeServices().then(() => {
  app.listen(port, () => {
    console.log(`🧠 Memory Service running on http://localhost:${port}`);
  });
});
