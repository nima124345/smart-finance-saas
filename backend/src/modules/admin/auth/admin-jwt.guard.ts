import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard สำหรับทุก route ภายใต้ /admin (ยกเว้น login/refresh) */
@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {}
