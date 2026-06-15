import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/** Error envelope มาตรฐาน + map Prisma errors → HTTP code */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ?? message);
      code = exception.constructor.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 unique, P2025 not found ฯลฯ — รายละเอียดเต็มใน Step 6
      ({ status, message, code } = this.mapPrismaError(exception));
    }

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      success: false,
      error: { code, message },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT, message: 'Duplicate value', code: 'DUPLICATE' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found', code: 'NOT_FOUND' };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Database error',
          code: e.code,
        };
    }
  }
}
