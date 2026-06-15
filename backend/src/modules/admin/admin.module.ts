import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminTokenService } from './auth/admin-token.service';
import { AdminJwtStrategy } from './auth/admin-jwt.strategy';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminBillingService } from './services/admin-billing.service';
import { AdminWorkspacesService } from './services/admin-workspaces.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminSupportService } from './services/admin-support.service';
import { AdminSettingsService } from './services/admin-settings.service';

@Module({
  imports: [
    PassportModule,
    SubscriptionsModule, // changePlan / limits
    AuthModule, // TokenService (impersonation)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.adminAccessSecret'),
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [
    AuditService,
    AdminAuthService,
    AdminTokenService,
    AdminJwtStrategy,
    AdminDashboardService,
    AdminUsersService,
    AdminBillingService,
    AdminWorkspacesService,
    AdminAnalyticsService,
    AdminSupportService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
