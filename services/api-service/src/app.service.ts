import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-service',
    };
  }

  getInfo() {
    return {
      name: 'AGL API Service',
      version: '0.1.0',
      description: 'AI Game Companion Engine - API Service',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        games: '/api/v1/games',
        characters: '/api/v1/characters',
      },
    };
  }
}
