import { Module } from '@nestjs/common';
import { GenesisSignalsController } from './genesis-signals.controller';
import { GenesisSignalsGateway } from './genesis-signals.gateway';
import { ConfigModule } from '@nestjs/config';
import { SignalsModule } from '../signals/signals.module';
import { GenesisUsersModule } from '../genesis-users/genesis-users.module';
import { GenesisSocketClientService } from './genesis-socket-client.service';

@Module({
  imports: [ConfigModule, SignalsModule, GenesisUsersModule],
  controllers: [GenesisSignalsController],
  providers: [GenesisSignalsGateway, GenesisSocketClientService],
  exports: [GenesisSignalsGateway],
})
export class GenesisSignalsModule {}

