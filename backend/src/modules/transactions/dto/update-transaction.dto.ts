import { OmitType, PartialType } from '@nestjs/mapped-types';

import { CreateTransactionDto } from './create-transaction.dto';

/**
 * แก้ไขรายการ — ทุกฟิลด์ optional ยกเว้น `type` (ห้ามเปลี่ยนหลังสร้าง)
 * การเปลี่ยน income↔expense↔transfer กระทบ wallet/category rules → ให้ลบแล้วสร้างใหม่แทน
 */
export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['type'] as const),
) {}
