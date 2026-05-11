import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hold, HoldStatus, HoldType } from './schema/hold.schema';
import { CreateHoldDto } from './dto/create-hold.dto';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { BlockchainService } from '../wallets/blockchain.service';

@Injectable()
export class HoldsService {
  constructor(
    @InjectModel(Hold.name) private holdModel: Model<Hold>,
    private usersService: UsersService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createHoldDto: CreateHoldDto): Promise<Hold> {
    const hold = new this.holdModel({
      ...createHoldDto,
      user_id: createHoldDto.userId,
      transaction_id: createHoldDto.transactionId,
    });
    return hold.save();
  }

  async findAll(): Promise<Hold[]> {
    return this.holdModel.find().populate('user_id', 'username email').exec();
  }

  async findPending(): Promise<Hold[]> {
    return this.holdModel
      .find({ status: HoldStatus.PENDING })
      .populate('user_id', 'username email')
      .exec();
  }

  async findByUser(userId: string): Promise<Hold[]> {
    return this.holdModel
      .find({ user_id: userId })
      .populate('user_id', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async approve(holdId: string): Promise<Hold> {
    const hold = await this.holdModel.findById(holdId);
    if (!hold) throw new NotFoundException('Hold not found');
    if (hold.status !== HoldStatus.PENDING)
      throw new BadRequestException('Hold is not pending');

    // 0. Send USDT
    let txHash = '';
    if (hold.amount > 0 && hold.wallet) {
      const result = await this.blockchainService.sendUSDT(
        hold.wallet,
        hold.amount,
      );
      if (result.error) {
        throw new BadRequestException(
          `USDT Transfer failed: ${result.receipt}`,
        );
      }
      txHash = result.tx;
    }

    // 1. Update Hold Status
    hold.status = HoldStatus.APPROVED;
    await hold.save();

    // 2. Update Transaction Status
    await this.transactionsService.updateStatus(
      hold.transaction_id.toString(),
      TransactionStatus.APPROVED,
      txHash || undefined,
    );

    return hold;
  }

  async reject(holdId: string, reason?: string): Promise<Hold> {
    const hold = await this.holdModel.findById(holdId);
    if (!hold) throw new NotFoundException('Hold not found');
    if (hold.status !== HoldStatus.PENDING)
      throw new BadRequestException('Hold is not pending');

    // 1. Update Hold Status
    hold.status = HoldStatus.REJECTED;
    hold.reason = reason;
    await hold.save();

    // 2. Refund Points
    await this.usersService.updatePoints(hold.user_id.toString(), hold.amount); // Add points back (positive amount)

    // 3. Update Transaction Status
    await this.transactionsService.updateStatus(
      hold.transaction_id.toString(),
      TransactionStatus.REJECTED,
    );

    return hold;
  }
}
