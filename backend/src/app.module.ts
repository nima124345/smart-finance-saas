import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

import { AppController } from './app.controller';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';
import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { TeamModule } from './modules/team/team.module';
import { ActivityModule } from './modules/activity/activity.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BusinessModule } from './modules/business/business.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('throttle.redisUrl');
        return {
          throttlers: [
            {
              ttl: config.get<number>('throttle.ttl', 60) * 1000,
              limit: config.get<number>('throttle.limit', 120),
            },
          ],
          // มี REDIS_URL → แชร์ counter ข้าม instance; ไม่มี → in-memory (default)
          storage: redisUrl
            ? new RedisThrottlerStorage(
                new Redis(redisUrl, { maxRetriesPerRequest: 1 }),
              )
            : undefined,
        };
      },
    }),
    PrismaModule,

    // Feature modules (domain)
    AuthModule,
    UsersModule,
    WorkspacesModule,
    MembershipsModule,
    TeamModule,
    ActivityModule,
    WalletsModule,
    CategoriesModule,
    TransactionsModule,
    DashboardModule,
    BusinessModule,
    SubscriptionsModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    // JWT required ทุก route (ยกเว้น @Public) + rate limit ทั่วระบบ
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
