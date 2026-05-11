import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit-operation.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<string>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!auditAction) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    // Info previo a la ejecución (opcional, aquí lo hacemos después)

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Intentar obtener ID del usuario si no estaba antes (ej: login)
          const finalUser = user || request.user;
          const performedBy = finalUser
            ? finalUser.id || finalUser._id || finalUser.sub
            : 'anonymous';

          // Detalles extras
          const details = {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
            body: request.body ? '***' : undefined, // Ocultar body por seguridad o filtrar
          };

          await this.auditLogService.log({
            action: auditAction,
            module: this.getModuleName(context),
            performedBy: performedBy,
            ip: ip,
            userAgent: userAgent,
            details: details,
          });
        } catch (e) {
          this.logger.error(
            `Error logging audit action: ${e.message}`,
            e.stack,
          );
        }
      }),
    );
  }

  private getModuleName(context: ExecutionContext): string {
    return context.getClass().name.replace('Controller', '').toUpperCase();
  }
}
