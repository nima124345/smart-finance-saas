import { Module } from '@nestjs/common';

import { WalletsModule } from '../wallets/wallets.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [WalletsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
