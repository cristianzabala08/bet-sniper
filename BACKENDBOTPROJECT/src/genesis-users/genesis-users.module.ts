import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GenesisUsersController } from './genesis-users.controller';
import { GenesisUsersService } from './genesis-users.service';
import { GenesisUser, GenesisUserSchema } from './schema/genesis-user.schema';
import { GenesisJwtGuard } from '../genesis-signals/genesis-jwt.guard';
import { BlockchainService } from 'src/wallets/blockchain.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: GenesisUser.name, schema: GenesisUserSchema },
    ]),
  ],
  controllers: [GenesisUsersController],
  providers: [GenesisUsersService, GenesisJwtGuard, BlockchainService],
  exports: [GenesisUsersService],
})
export class GenesisUsersModule {}
