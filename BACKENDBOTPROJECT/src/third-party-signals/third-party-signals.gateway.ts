import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalsService } from '../signals/signals.service';

@WebSocketGateway({
  namespace: '/external-signals',
  cors: { origin: '*' },
})
export class ThirdPartySignalsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ThirdPartySignalsGateway.name);
  private expectedApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly signalsService: SignalsService,
  ) {
    this.expectedApiKey = 'EmpresaExterna123';
  }

  afterInit(server: Server) {
    // Register this gateway with the SignalsService to receive broadcasted events
    this.signalsService.registerAdditionalGateway(this);
    this.logger.log(
      'ThirdPartySignalsGateway initialized and registered with SignalsService.',
    );
  }

  handleConnection(client: Socket) {
    try {
      // Allow passing the API key in the auth payload, query parameters, or headers
      const apiKey =
        client.handshake.auth?.apiKey ||
        client.handshake.headers['x-api-key'] ||
        client.handshake.headers['authorization']
          ?.replace('Bearer ', '')
          ?.replace('Api-Key ', '') ||
        client.handshake.query?.apiKey;

      if (!apiKey || apiKey !== this.expectedApiKey) {
        this.logger.warn(
          `Third-party client ${client.id} tried to connect with invalid or missing API key`,
        );
        client.disconnect();
        return;
      }

      this.logger.log(`Third-party client connected securely: ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Connection authentication failed for third-party client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Third-party client disconnected: ${client.id}`);
  }

  emitUpdate(data: any) {
    this.server.emit('dashboardUpdate', data);
  }
}
