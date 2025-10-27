import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, GameAnalyticsQueryDto, CostAnalyticsQueryDto } from './dto/analytics-query.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/metrics
   * Get raw service metrics
   */
  @Get('metrics')
  async getMetrics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getServiceMetrics(query);
  }

  /**
   * GET /analytics/games/:gameId
   * Get analytics for a specific game
   */
  @Get('games/:gameId')
  async getGameAnalytics(
    @Param('gameId') gameId: string,
    @Query() query: GameAnalyticsQueryDto
  ) {
    return this.analyticsService.getDailyAnalytics(gameId, query);
  }

  /**
   * GET /analytics/games/:gameId/usage
   * Get game usage statistics
   */
  @Get('games/:gameId/usage')
  async getGameUsageStats(
    @Param('gameId') gameId: string,
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getGameUsageStats(gameId, daysNum);
  }

  /**
   * GET /analytics/games/:gameId/emotions
   * Get emotion distribution for a game
   */
  @Get('games/:gameId/emotions')
  async getEmotionDistribution(
    @Param('gameId') gameId: string,
    @Query() query: GameAnalyticsQueryDto
  ) {
    return this.analyticsService.getEmotionDistribution(
      gameId,
      query.startDate,
      query.endDate
    );
  }

  /**
   * GET /analytics/hourly
   * Get hourly analytics for real-time monitoring
   */
  @Get('hourly')
  async getHourlyAnalytics(
    @Query('gameId') gameId?: string,
    @Query('hours') hours?: string
  ) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.analyticsService.getHourlyAnalytics(gameId, hoursNum);
  }

  /**
   * GET /analytics/costs
   * Get cost analytics
   */
  @Get('costs')
  async getCostAnalytics(@Query() query: CostAnalyticsQueryDto) {
    return this.analyticsService.getCostAnalytics(query);
  }

  /**
   * GET /analytics/platform
   * Get overall platform statistics
   */
  @Get('platform')
  async getPlatformStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getPlatformStats(daysNum);
  }
}
