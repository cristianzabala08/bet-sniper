import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: { origin: '*' }, // Configure appropriately for production
})
export class SignalsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SignalsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} tried to connect without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      // 🔥 Validación profunda: Usuario real y sesión activa
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(
          `Connection rejected: User ${payload.sub} not found or inactive`,
        );
        client.disconnect();
        return;
      }

      /*  if(!user.activated){
          this.logger.warn(
            `Connection rejected: User ${payload.sub} not activated`,
          );
          client.disconnect();
          return;
        }
 */
      // Validar Session ID (evitar duplicados o sesiones expiradas)
      if (payload.sessionId && user.loginSessionId !== payload.sessionId) {
        this.logger.warn(
          `Connection rejected: Session mismatch for user ${user.username}`,
        );
        client.disconnect();
        return;
      }

      // Validar Membresía activa
      if (
        !user.membership_expiration ||
        new Date(user.membership_expiration) < new Date()
      ) {
        this.logger.warn(
          `Connection rejected: Membership expired for user ${user.username}`,
        );
        client.disconnect();
        return;
      }

      this.logger.log(
        `Client connected and validated: ${client.id} (User: ${user.username})`,
      );
    } catch (error) {
      this.logger.error(
        `Connection authentication failed for ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitUpdate(data: any) {
    this.server.emit('dashboardUpdate', data);
  }
}
