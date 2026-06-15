import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // ถูกเรียกโดย app.enableShutdownHooks() ตอน SIGTERM/redeploy → ปิด connection pool สะอาด
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Tenant-scoped client (Step 6): คืน client ที่เติม where { workspaceId }
   * อัตโนมัติผ่าน $extends — กันลืม scope ราย query
   * TODO(Step 6): implement Prisma Client Extension
   */
  forWorkspace(_workspaceId: bigint): PrismaService {
    return this;
  }
}
