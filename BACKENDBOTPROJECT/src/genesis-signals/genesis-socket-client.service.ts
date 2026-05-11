import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { SignalsService } from '../signals/signals.service';

/**
 * WebSocket Client to connect to an external backend socket.
 * Receives signal updates and processes them through the local SignalsService.
 */
@Injectable()
export class GenesisSocketClientService implements OnModuleInit {
  private socket: Socket;
  private readonly logger = new Logger(GenesisSocketClientService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly signalsService: SignalsService,
  ) {}

  onModuleInit() {
    this.connect();
  }

  private connect() {
    const socketUrl = this.configService.get<string>('GENESIS_SOCKET_URL');
    const socketToken = 'EmpresaExterna123';

    if (!socketUrl) {
      this.logger.warn(
        'GENESIS_SOCKET_URL is not configured. External socket connection skipped.',
      );
      return;
    }

    this.logger.log(`Connecting to external socket: ${socketUrl}`);

    this.socket = io(socketUrl + '/external-signals', {
      transports: ['websocket'],
      auth: {
        apiKey: socketToken, // Ahora usamos la variable token como apiKey
      },
      extraHeaders: {
        'x-api-key': socketToken,
      },
    });

    this.socket.on('connect', () => {
      this.logger.log(
        `Successfully connected to external socket: ${this.socket.id}`,
      );
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`Disconnected from external socket: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(
        `Connection error for external socket: ${error.message}`,
      );
    });

    // Listen for the standard signal update event
    this.socket.on('dashboardUpdate', async (data: any) => {
      this.logger.log('Received signal update from external socket');
      try {
        let payload: any = null;

        // Desenvolver el objeto para llegar al payload original del webhook
        // (el que tiene la clave 'results' o 'signal')
        if (data?.data?.data?.signal || data?.data?.data?.results) {
          payload = data.data.data;
        } else if (data?.data?.signal || data?.data?.results) {
          payload = data.data;
        } else if (data?.signal || data?.results) {
          payload = data;
        }

        if (payload) {
          this.logger.log(
            `>>> Procesando payload desenvuelto para ${payload.results ? 'RESULTADO' : 'SEÑAL'}`,
          );
          await this.signalsService.processBaccaratLogic(payload);
        } else {
          this.logger.warn(
            'El evento no contenía un payload procesable:',
            JSON.stringify(data).substring(0, 50),
          );
        }
      } catch (error) {
        this.logger.error(`Error processing external signal: ${error.message}`);
      }
    });

    // If there's another event type, we can add it here
    this.socket.on('newSignal', async (data: any) => {
      this.logger.log('Received newSignal from external socket');

      let payload = data?.data?.data || data?.data || data;
      await this.signalsService.processBaccaratLogic(payload);
    });
  }

  /**
   * Manual reconnect if needed
   */
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connect();
  }
}
