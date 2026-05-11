import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';
import { Hold, HoldSchema } from './schema/hold.schema';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Hold.name, schema: HoldSchema }]),
    UsersModule, // For refunding points
    forwardRef(() => TransactionsModule), // Circular dependency with Transactions
    WalletsModule,
  ],
  controllers: [HoldsController],
  providers: [HoldsService],
  exports: [HoldsService],
})
export class HoldsModule {}
