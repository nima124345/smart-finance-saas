import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * จัดการสมาชิก workspace (owner/admin/member)
 * V1: ใช้ภายใน (สร้าง owner ตอนสร้าง workspace). UI sharing = future
 */
@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  // invite / changeRole / remove — future (เผื่อ schema ไว้แล้ว)
}
