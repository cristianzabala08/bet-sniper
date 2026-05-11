import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignalsGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-webhook-secret'];
    const expectedSecret = this.configService.get<string>(
      'SIGNAL_WEBHOOK_SECRET',
    );

    if (!expectedSecret) {
      // If no secret is configured, arguably we should block everything or allow everything.
      // For security, let's block and log a warning if needed, or throw error.
      // But for development simplicity, let's assume it MUST be configured.
      console.warn(
        'SIGNAL_WEBHOOK_SECRET is not defined in environment variables.',
      );
      return false;
    }

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
