import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get metrics summary (lightweight)' })
  @ApiOkResponse({ description: 'Metrics summary returned.' })
  getSummary() {
    return this.metricsService.getSummary();
  }
}
