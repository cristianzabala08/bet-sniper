import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandingConfig, LandingConfigSchema } from './schema/landing-config.schema';
import { LandingConfigController } from './landing-config.controller';
import { LandingConfigService } from './landing-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LandingConfig.name, schema: LandingConfigSchema }]),
  ],
  controllers: [LandingConfigController],
  providers: [LandingConfigService],
  exports: [LandingConfigService],
})
export class LandingConfigModule {}
