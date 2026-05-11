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
    const { method, url, body } = request;
    const now = Date.now();
    this.logger.log(`[LoggingInterceptor] Incoming: ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: (val) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          const msg = `${method} ${url} ${response.statusCode} - ${delay}ms`;
          this.logger.log(`[LoggingInterceptor] Success: ${msg}`);
          this.logger.log(`[LoggingInterceptor] Body: ${JSON.stringify(body)}`);
          /* this.logger.log(
            `[LoggingInterceptor] Response: ${JSON.stringify(val)}`,
          ); */
        },
        error: (err) => {
          const delay = Date.now() - now;
          this.logger.log(
            `${method} ${url} - ${delay}ms - Error: ${err.message}`,
            err.stack,
          );
        },
      }),
    );
  }
}
