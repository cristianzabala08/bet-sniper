import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { SignalsService } from '../signals/signals.service';

/**
 * WebSocket Client to connect to an external backend socket.
 * Receives signal updates and processes them through the local SignalsService.
 * Includes automatic reconnection and health monitoring.
 */
@Injectable()
export class GenesisSocketClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket;
  private readonly logger = new Logger(GenesisSocketClientService.name);
  private healthCheckInterval: ReturnType<typeof setInterval>;
  private lastDataReceived: Date | null = null;

  private static readonly HEALTH_CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
  private static readonly DATA_SILENCE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min without data => force reconnect

  constructor(
    private readonly configService: ConfigService,
    private readonly signalsService: SignalsService,
  ) {}

  onModuleInit() {
    this.connect();
    this.startHealthCheck();
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      if (!this.socket?.connected) {
        this.logger.warn(
          '[HealthCheck] Socket disconnected, forcing reconnect...',
        );
        this.reconnect();
        return;
      }

      if (this.lastDataReceived) {
        const silenceMs = Date.now() - this.lastDataReceived.getTime();
        if (silenceMs > GenesisSocketClientService.DATA_SILENCE_THRESHOLD_MS) {
          this.logger.warn(
            `[HealthCheck] No data received for ${Math.round(silenceMs / 1000)}s, forcing reconnect...`,
          );
          this.reconnect();
        }
      }
    }, GenesisSocketClientService.HEALTH_CHECK_INTERVAL_MS);
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
        apiKey: socketToken,
      },
      extraHeaders: {
        'x-api-key': socketToken,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.logger.log(
        `Successfully connected to external socket: ${this.socket.id}`,
      );
      this.lastDataReceived = new Date();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`Disconnected from external socket: ${reason}`);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.logger.log(`Reconnection attempt #${attempt} to external socket`);
    });

    this.socket.on('reconnect', (attempt) => {
      this.logger.log(
        `Reconnected to external socket after ${attempt} attempts`,
      );
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error(
        'All reconnection attempts failed. Will retry via health check.',
      );
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(
        `Connection error for external socket: ${error.message}`,
      );
    });

    // Listen for the standard signal update event
    this.socket.on('dashboardUpdate', async (data: any) => {
      this.lastDataReceived = new Date();
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
      this.lastDataReceived = new Date();
      this.logger.log('Received newSignal from external socket');

      let payload = data?.data?.data || data?.data || data;
      await this.signalsService.processBaccaratLogic(payload);
    });
  }

  /**
   * Force reconnect - disconnects and reconnects the socket.
   */
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connect();
  }
}
