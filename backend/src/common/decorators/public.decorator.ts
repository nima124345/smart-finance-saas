import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** ทำให้ route ข้าม JwtAuthGuard (เช่น login/register/forgot-password) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
