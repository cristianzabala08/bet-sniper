import { Module } from '@nestjs/common';
import { ThirdPartySignalsGateway } from './third-party-signals.gateway';
import { ThirdPartySignalsController } from './third-party-signals.controller';
import { SignalsModule } from '../signals/signals.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, SignalsModule],
  providers: [ThirdPartySignalsGateway],
  controllers: [ThirdPartySignalsController],
})
export class ThirdPartySignalsModule {}
