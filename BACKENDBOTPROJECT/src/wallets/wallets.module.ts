import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { BlockchainService } from './blockchain.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [WalletsService, BlockchainService], // Added BlockchainService
  exports: [WalletsService, BlockchainService],
})
export class WalletsModule {}
