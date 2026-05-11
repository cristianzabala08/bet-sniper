import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const apiKey = 
      request.headers['x-api-key'] || 
      request.query?.apiKey ||
      request.headers['authorization']?.replace('Bearer ', '')?.replace('Api-Key ', '');

    const expectedApiKey = this.configService.get<string>('THIRD_PARTY_API_KEY') || 'EmpresaExterna123';

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
