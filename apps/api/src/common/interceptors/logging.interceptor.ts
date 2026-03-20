import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { maskData, maskObject } from '../utils/obfuscation.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { traceId?: string }>();
    const response = ctx.getResponse<Response>();
    const { method, url, body } = request;
    const traceId = request.traceId || 'unknown';
    const now = Date.now();

    // Mask sensitive fields in body for logging
    const maskedBody = maskObject(body, ['password', 'token', 'secret', 'email']);

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const duration = Date.now() - now;
        
        this.logger.log(
          `[${traceId}] ${method} ${url} ${statusCode} - ${duration}ms`
        );
        
        if (Object.keys(maskedBody || {}).length > 0) {
          // Optional: Only log body in dev or for specific non-GET methods
          if (method !== 'GET') {
            this.logger.debug(`[${traceId}] Body: ${JSON.stringify(maskedBody)}`);
          }
        }
      }),
    );
  }
}
