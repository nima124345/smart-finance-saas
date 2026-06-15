import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Production request logging
 * format:
 * METHOD PATH STATUS DURATIONms
 *
 * Example:
 * GET /api/v1/auth/me 200 23ms
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const http = context.switchToHttp();

    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, originalUrl } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.log(
          `${method} ${originalUrl} ${res.statusCode} ${duration}ms`,
        );
      }),
    );
  }
}
