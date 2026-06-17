import { Controller, Get } from '@nestjs/common';

import { Public } from './common/decorators/public.decorator';

/**
 * Root landing — อยู่นอก global prefix (ดู exclude ใน main.ts) เพื่อให้เปิด `/`
 * แล้วเจอข้อมูล API แทน 404 (เปิดสาธารณะ ไม่ต้อง auth)
 */
@Public()
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Smart Finance SaaS API',
      version: 'v1',
      status: 'ok',
      health: '/api/v1/health',
    };
  }
}
