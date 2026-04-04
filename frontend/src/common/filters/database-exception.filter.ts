import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface DatabaseErrorLike {
  code?: string;
  detail?: string;
  message?: string;
}

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      this.sendHttpException(response, request, exception);
      return;
    }

    const dbError = this.extractDbError(exception);

    if (!dbError) {
      this.sendHttpException(
        response,
        request,
        new InternalServerErrorException('Unexpected server error'),
      );
      return;
    }

    if (dbError.code === '23505') {
      this.sendHttpException(
        response,
        request,
        new ConflictException(dbError.detail ?? 'Duplicate value conflict'),
      );
      return;
    }

    if (dbError.code === '23503') {
      this.sendHttpException(
        response,
        request,
        new ConflictException('This record is referenced by other data'),
      );
      return;
    }

    if (dbError.code === '42P01') {
      this.sendHttpException(
        response,
        request,
        new InternalServerErrorException(
          'Database schema is not initialized. Run db push/migrate.',
        ),
      );
      return;
    }

    this.sendHttpException(
      response,
      request,
      new HttpException(
        dbError.message ?? 'Database operation failed',
        HttpStatus.BAD_REQUEST,
      ),
    );
  }

  private sendHttpException(
    response: Response,
    request: Request,
    exception: HttpException,
  ) {
    const status = exception.getStatus();
    const raw = exception.getResponse();
    const payload =
      typeof raw === 'string'
        ? { message: raw }
        : (raw as Record<string, unknown>);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...payload,
    });
  }

  private extractDbError(error: unknown): DatabaseErrorLike | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const maybeAny = error as { cause?: unknown; message?: string };

    if (maybeAny.cause && typeof maybeAny.cause === 'object') {
      const cause = maybeAny.cause as DatabaseErrorLike;
      if (cause.code || cause.message) {
        return cause;
      }
    }

    const self = error as DatabaseErrorLike;
    if (self.code || self.message) {
      return self;
    }

    return null;
  }
}
