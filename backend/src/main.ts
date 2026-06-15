import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// BigInt (money = สตางค์) ไม่ serialize เป็น JSON ได้เอง → ส่งออกเป็น string
// (ฝั่ง frontend แปลงกลับเป็น number/Decimal ตอนแสดงผล)
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // อยู่หลัง reverse proxy (Railway/Vercel) — เชื่อ X-Forwarded-* ชั้นแรก
  // เพื่อให้ req.ip = client จริง (rate limit / brute-force / audit log) + รู้ว่าเป็น HTTPS
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // drain connection อย่างนุ่มนวลตอน SIGTERM (redeploy) — เรียก onModuleDestroy ของ Prisma
  app.enableShutdownHooks();

  const prefix = config.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(prefix);

  app.use(helmet());
  app.use(cookieParser());
  // ต้อง credentials:true + origin เจาะจง เพื่อให้ httpOnly cookie ทำงานข้าม origin
  // รองรับหลาย origin (tenant app + admin portal) — ดู app.corsOrigins ใน configuration
  const corsOrigins = config.get<string[]>('app.corsOrigins', [
    'http://localhost:3000',
  ]);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Validation ทุก endpoint (DTO) — whitelist กัน over-posting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // request logging (METHOD PATH STATUS DURATIONms) + มาตรฐาน response envelope + error envelope
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('app.port', 8000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API ready at http://localhost:${port}/${prefix}`);
}

void bootstrap();
