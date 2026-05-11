import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  // In-memory cache for simplicity. PROD advice: use Redis.
  // Key: userId-method-url, Value: timestamp
  private locks = new Map<string, number>();
  private readonly COOLDOWN_MS = 3000; // 3 seconds cooldown

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (public endpoint), skip or use IP?
    // Assuming protected routes as per requirement.
    if (!user || (!user.id && !user.sub && !user._id)) {
      return next.handle();
    }

    const userId = user.id || user.sub || user._id;
    const key = `${userId}-${request.method}-${request.url}`;
    const now = Date.now();

    if (this.locks.has(key)) {
      const lastTime = this.locks.get(key) || 0;
      if (now - lastTime < this.COOLDOWN_MS) {
        throw new ConflictException('REQUEST_ALREADY_IN_PROGRESS_OR_COOLDOWN');
      }
    }

    // Set lock
    this.locks.set(key, now);

    // Cleanup old keys periodically or let them stay (small enough for memory if user count low)
    // For this implementation, we can just leave them or delete after cooldown.
    // Better: delete after cooldown to prevent map growing indefinitely?
    // Actually, just overwriting is fine, but we should cleanup to avoid memory leak if many users.
    // Let's set a timeout to delete.
    setTimeout(() => {
      this.locks.delete(key);
    }, this.COOLDOWN_MS);

    return next.handle().pipe(
      tap(() => {
        // Optional: We could reset the lock here if we wanted "lock while processing",
        // but for "double click prevention" a hard cooldown is often better UX
        // to prevent accidental subsequent clicks.
      }),
    );
  }
}
