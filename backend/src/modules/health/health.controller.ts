import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { HealthService, HealthResult } from './health.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthResult> {
    return this.healthService.check();
  }
}
