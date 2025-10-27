import { Controller, Get, Post, Patch, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async findAll() {
    return this.gameService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const game = await this.gameService.findOne(id);
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  @Post()
  async create(@Body() body: { clientId: string; name: string; description?: string; config?: any }) {
    return this.gameService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; config?: any }
  ) {
    const game = await this.gameService.update(id, body);
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.gameService.remove(id);
    if (!result) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return {
      success: true,
      message: 'Game deactivated successfully',
    };
  }
}
