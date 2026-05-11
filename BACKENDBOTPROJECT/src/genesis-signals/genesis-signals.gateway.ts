import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalsService } from '../signals/signals.service';
import { GenesisUsersService } from '../genesis-users/genesis-users.service';
import * as jwt from 'jsonwebtoken';

/**
 * WebSocket Gateway for Genesis frontend.
 * Uses namespace '/genesis-signals' to separate from existing bet-sniper-pwa connections.
 * Validates BackendWeb3.0 JWT tokens on connection.
 */
@WebSocketGateway({
  namespace: '/genesis-signals',
  cors: { origin: '*' },
})
export class GenesisSignalsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GenesisSignalsGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly signalsService: SignalsService,
    private readonly genesisUsersService: GenesisUsersService,
  ) {}

  onModuleInit() {
    // Register this gateway with the SignalsService so it receives
    // all signal updates alongside the main bet-sniper gateway
    this.signalsService.registerAdditionalGateway(this);
    this.logger.log('GenesisSignalsGateway registered with SignalsService');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Genesis client ${client.id} tried to connect without token`,
        );
        client.disconnect();
        return;
      }

      const genesisSecret =
        'LS0tLS1CRUdJSiBVU0EgUFJJVkFURSBLRVktLS0tLQpNSUlDV3dJQ>';

      if (!genesisSecret) {
        this.logger.error('GENESIS_JWT_SECRET is not configured');
        client.disconnect();
        return;
      }

      const payload = jwt.verify(token, genesisSecret) as any;

      if (!payload._id || !payload.userName) {
        this.logger.warn(`Genesis client ${client.id}: invalid token payload`);
        client.disconnect();
        return;
      }

      // Check if genesis user has an active plan
      const hasActivePlan = await this.genesisUsersService.isActive(
        payload._id,
      );

      if (!hasActivePlan) {
        this.logger.warn(
          `Genesis client ${client.id} (User: ${payload.userName}) has no active plan`,
        );
        client.emit('error', {
          message: 'NO_ACTIVE_PLAN',
          code: 'PLAN_REQUIRED',
        });
        client.disconnect();
        return;
      }

      this.logger.log(
        `Genesis client connected: ${client.id} (User: ${payload.userName}, Plan: active)`,
      );
      this.logger.log('Genesis client connected: ${client.id}');
    } catch (error) {
      this.logger.error(
        `Genesis connection auth failed for ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Genesis client disconnected: ${client.id}`);
  }

  /**
   * Emit signal update to all connected Genesis clients.
   * Called by the original SignalsService when new signals arrive.
   */
  emitUpdate(data: any) {
    this.server.emit('dashboardUpdate', data);
  }
}
