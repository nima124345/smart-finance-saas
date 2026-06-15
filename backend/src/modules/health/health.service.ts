import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthResult {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  database: 'connected' | 'disconnected';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResult> {
    try {
      // ตรวจ DB connection จริง
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  }
}
