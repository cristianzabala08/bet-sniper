import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Guard that validates JWT tokens issued by BackendWeb3.0 (Genesis backend).
 * This enables cross-authentication: genesis users can access signals
 * using their existing BackendWeb3.0 JWT token.
 */
@Injectable()
export class GenesisJwtGuard implements CanActivate {
  private readonly logger = new Logger(GenesisJwtGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    const genesisSecret =
      'LS0tLS1CRUdJSiBVU0EgUFJJVkFURSBLRVktLS0tLQpNSUlDV3dJQ>';
    if (!genesisSecret) {
      this.logger.error(
        'GENESIS_JWT_SECRET is not defined in environment variables',
      );
      throw new UnauthorizedException('Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, genesisSecret) as any;

      // Attach decoded genesis user info to request
      request.genesisUser = {
        _id: decoded._id,
        userName: decoded.userName,
        wallet: decoded.wallet,
        walletRef: decoded.walletRef,
        exp: decoded.exp,
      };

      return true;
    } catch (error) {
      this.logger.warn(`Genesis JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired genesis token');
    }
  }
}
