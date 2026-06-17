import { Module } from '@nestjs/common';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ActivityModule } from '../activity/activity.module';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { InvitationsController } from './invitations.controller';

@Module({
  imports: [SubscriptionsModule, ActivityModule],
  controllers: [TeamController, InvitationsController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
