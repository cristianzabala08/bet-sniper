import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingConfig } from './schema/landing-config.schema';
import { UpdateLandingConfigDto } from './dto/update-landing-config.dto';

@Injectable()
export class LandingConfigService {
  constructor(
    @InjectModel(LandingConfig.name) private configModel: Model<LandingConfig>,
  ) {}

  async getConfig(): Promise<LandingConfig> {
    let config = await this.configModel.findOne().exec();
    if (!config) {
      config = await this.configModel.create({});
    }
    return config;
  }

  async updateConfig(dto: UpdateLandingConfigDto): Promise<LandingConfig> {
    let config = await this.configModel.findOne().exec();
    if (!config) {
      config = await this.configModel.create(dto);
    } else {
      Object.assign(config, dto);
      await config.save();
    }
    return config;
  }
}
