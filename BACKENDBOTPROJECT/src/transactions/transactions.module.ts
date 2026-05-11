import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { UsersModule } from '../users/users.module';
import { HoldsModule } from '../holds/holds.module';
import { WalletsModule } from '../wallets/wallets.module'; // Added Import
import { forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module'; // Added Import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    CommissionsModule,
    UsersModule,
    WalletsModule, // Added module
    NotificationsModule, // Added module
    forwardRef(() => HoldsModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
