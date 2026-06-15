import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// BigInt (money = สตางค์) ไม่ serialize เป็น JSON ได้เอง → ส่งออกเป็น string
// (ฝั่ง frontend แปลงกลับเป็น number/Decimal ตอนแสดงผล)
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  const prefix = config.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(prefix);

  app.use(helmet());
  app.use(cookieParser());
  // ต้อง credentials:true + origin เจาะจง เพื่อให้ httpOnly cookie ทำงานข้าม origin
  app.enableCors({
    origin: config.get<string>('app.frontendUrl', 'http://localhost:3000'),
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

  // มาตรฐาน response envelope + error envelope
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('app.port', 8000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API ready at http://localhost:${port}/${prefix}`);
}

void bootstrap();
