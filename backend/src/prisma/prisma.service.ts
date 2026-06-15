import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', () => {
      void app.close();
    });
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
