import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller()
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('games/:gameId/players')
  async findAll(
    @Param('gameId') gameId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc'
  ) {
    const result = await this.playerService.findAll(gameId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      order,
    });

    if (!result) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return result;
  }

  @Post('games/:gameId/players')
  async createOrGet(
    @Param('gameId') gameId: string,
    @Body() body: { externalId: string; characterPersona?: string; preferences?: any }
  ) {
    const player = await this.playerService.createOrGet(gameId, body);

    if (!player) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return player;
  }

  @Get('players/:playerId')
  async findOne(@Param('playerId') playerId: string) {
    const player = await this.playerService.findOne(playerId);

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    return player;
  }

  @Patch('players/:playerId')
  async update(
    @Param('playerId') playerId: string,
    @Body() body: { characterPersona?: string; preferences?: any }
  ) {
    const player = await this.playerService.update(playerId, body);

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    return player;
  }
}
