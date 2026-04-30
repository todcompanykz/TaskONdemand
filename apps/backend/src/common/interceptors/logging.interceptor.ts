import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, originalUrl, path } = request;
    const now = Date.now();

    // Log all requests to /support endpoints
    if (
      url?.includes('/support') ||
      path?.includes('/support') ||
      originalUrl?.includes('/support')
    ) {
      this.logger.log(
        `[REQUEST] ${method} ${url || path || originalUrl} - User: ${request.user?.id || 'anonymous'}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        if (
          url?.includes('/support') ||
          path?.includes('/support') ||
          originalUrl?.includes('/support')
        ) {
          this.logger.log(
            `[RESPONSE] ${method} ${url || path || originalUrl} ${statusCode} - ${responseTime}ms`,
          );
        }
      }),
    );
  }
}
