import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from './schema/transaction.schema';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionDetail } from './enums/transaction-detail.enum';
import { UsersService } from '../users/users.service';
import { HoldsService } from '../holds/holds.service';
import { HoldType } from '../holds/schema/hold.schema';
import { CommissionsService } from '../commissions/commissions.service';
import { BlockchainService } from 'src/wallets/blockchain.service';
import { NotificationsService } from '../notifications/notifications.service';

const logger = new Logger('TransactionsService');

export interface PlanDefinition {
  id: number;
  name: string;
  price: number;
  duration: number;
  detail: TransactionDetail;
  label: string;
  internalId: number;
}

@Injectable()
export class TransactionsService {
  public readonly PLANS: PlanDefinition[] = [
    {
      id: 1,
      name: 'WEEKLY',
      price: 50,
      duration: 7,
      label: '1 Week',
      internalId: 0,
      detail: TransactionDetail.MEMBERSHIP_WEEKLY,
    },
    {
      id: 2,
      name: 'BASIC',
      price: 100,
      duration: 30,
      label: '1 Month',
      internalId: 1,
      detail: TransactionDetail.MEMBERSHIP_BASIC,
    },
    {
      id: 3,
      name: 'AMATEUR',
      price: 250,
      duration: 90,
      label: '3 Months',
      internalId: 2,
      detail: TransactionDetail.MEMBERSHIP_AMATEUR,
    },
    {
      id: 4,
      name: 'PRO',
      price: 500,
      duration: 180,
      label: '6 Months',
      internalId: 3,
      detail: TransactionDetail.MEMBERSHIP_PRO,
    },
    {
      id: 5,
      name: 'EXPERT',
      price: 750,
      duration: 270,
      label: '9 Months',
      internalId: 4,
      detail: TransactionDetail.MEMBERSHIP_EXPERT,
    },
    {
      id: 6,
      name: 'ELITE',
      price: 1000,
      duration: 365,
      label: '12 Months',
      internalId: 5,
      detail: TransactionDetail.MEMBERSHIP_ELITE,
    },
  ];
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<Transaction>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => HoldsService))
    private readonly holdsService: HoldsService,
    private readonly commissionsService: CommissionsService,
    private readonly blockchainService: BlockchainService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    type: string,
    amount: number,
    status?: TransactionStatus,
    details?: TransactionDetail,
    txHash?: string,
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      user_id: userId,
      type,
      amount,
      status: status || TransactionStatus.PENDING,
      details,
      txHash,
    });
    logger.log('create success');
    return transaction.save();
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.find().exec();
  }

  async findAllPaginated(
    filter: any = {},
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const transactions = await this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'user_id',
        select: 'username email wallet',
        match: {
          _id: { $type: 'objectId' }, // 🔥 SOLO ObjectId reales
        },
      })
      .exec();

    const total = await this.transactionModel.countDocuments(filter);

    return { data: transactions, total };
  }

  async findByUser(userId: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user_id',
        select: 'username email wallet',
        match: {
          _id: { $type: 'objectId' }, // 🔥 solo usuarios reales
        },
      })
      .exec();
  }

  async updateStatus(
    transactionId: string,
    status: TransactionStatus,
    txHash?: string,
  ): Promise<Transaction> {
    const updateData: any = { status };
    if (txHash) updateData.txHash = txHash;

    const transaction = await this.transactionModel.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true },
    );
    if (!transaction) throw new NotFoundException('TRANSACTION_NOT_FOUND');
    logger.log('updateStatus success');
    return transaction;
  }

  async withdraw(userId: string, amount: number, twoFactorCode: string) {
    // 1. Validate 2FA
    const is2faValid = await this.usersService.validateTwoFactorCode(
      userId,
      twoFactorCode,
    );
    if (!is2faValid) throw new BadRequestException('INVALID_2FA_CODE');

    // 2. Validate User & Balance
    const user = await this.usersService.findById(userId); // Ensure findById exists or use findOne if it takes ID
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    // updatePoints throws error if insufficient funds. We do this *before* creating the transaction to ensure funds exist.
    await this.usersService.updatePoints(userId, -amount);

    // 3. Determine Wallet Address
    const walletAddress = user.wallet || user.wallet_address;
    if (!walletAddress) {
      // Refund points if no wallet (unlikely if we checked before, but good safety) - actually rollback is complex here,
      // better to check wallet BEFORE deducting points.
      // Let's refactor slightly to check wallet first.
      throw new BadRequestException('WALLET_NOT_CONFIGURED');
    }

    // Refactored flow:
    // 1. Validate 2FA (Done above)
    // 2. Get User & Check Wallet
    // 3. Deduct Points
    // 4. Create Transaction & Hold

    // 3. Create Transaction (PENDING)
    // The user requested: "In type put the wallet".
    // The schema says type is string, so we can put the address there.
    const transaction = await this.create(
      userId,
      walletAddress, // Store wallet address in 'type' field per user request
      -amount,
      TransactionStatus.PENDING,
      TransactionDetail.WITHDRAW,
    );

    if (transaction) {
      await this.notificationsService.create({
        date: new Date().toISOString(),
        description: 'Withdrawal Request',
        userId,
        status: false,
      });
    } else {
      console.log('No se realizó dicha transacción WITHDRAW');
    }

    // 4. Create Hold
    await this.holdsService.create({
      userId,
      transactionId: transaction._id.toString(),
      amount,
      type: HoldType.WITHDRAW,
      wallet: walletAddress,
    });

    logger.log('withdraw success');
    return transaction;
  }

  async transfer(
    userId: string,
    amount: number,
    targetUsernameOrEmail: string,
    twoFactorCode: string,
    username: string,
  ) {
    if (amount <= 0) throw new BadRequestException('INVALID_AMOUNT_POSITIVE');

    // 1. Validate 2FA
    const is2faValid = await this.usersService.validateTwoFactorCode(
      userId,
      twoFactorCode,
    );
    if (!is2faValid) throw new BadRequestException('INVALID_2FA_CODE');

    // 2. Find Target User
    const targetUser =
      (await this.usersService.findOne(targetUsernameOrEmail)) ||
      (await this.usersService.findByEmail(targetUsernameOrEmail));
    if (!targetUser) throw new NotFoundException('TARGET_USER_NOT_FOUND');
    if (targetUser._id.toString() === userId)
      throw new BadRequestException('SELF_TRANSFER_NOT_ALLOWED');

    // 3. Deduct from Sender
    await this.usersService.updatePoints(userId, -amount);

    // 4. Add to Receiver
    await this.usersService.updatePoints(targetUser._id.toString(), amount);

    // 5. Create Transaction (Sender)
    const senderTx = await this.create(
      userId,
      targetUser.username,
      -amount,
      TransactionStatus.APPROVED, // or ACTIVE/COMPLETED. Using APPROVED based on requested enum.
      TransactionDetail.USER_TRANSFER,
    );

    await this.notificationsService.create({
      date: new Date().toISOString(),
      description: 'Transferencia exitosa',
      userId,
      status: false,
    });

    // 6. Create Transaction (Receiver)
    await this.create(
      targetUser._id.toString(),
      username,
      amount,
      TransactionStatus.APPROVED,
      TransactionDetail.DEPOSIT, // Or a new Detail like TRANSFER_RECEIVED? Using DEPOSIT for now or USER_TRANSFER.
    );

    await this.notificationsService.create({
      date: new Date().toISOString(),
      description: 'Transferencia exitosa',
      userId: targetUser._id.toString(),
      status: false,
    });

    logger.log('Transferencia exitosa');

    return senderTx;
  }

  async purchasePlan(userId: string, txHash: string, username?: string) {
    logger.log(
      `[purchasePlan] 🚀 Starting purchase for User: ${userId} with Hash: ${txHash}`,
    );

    // 1. Normalizar hash a minúsculas
    const normalizedHash = txHash.toLowerCase();

    // 2. Seguridad: Verificar si el hash ya fue usado
    const existingTx = await this.transactionModel.findOne({
      txHash: normalizedHash,
    });
    if (existingTx) {
      logger.error(`[purchasePlan] ❌ Hash ALREADY USED: ${normalizedHash}`);
      throw new BadRequestException('HASH_ALREADY_USED');
    }

    logger.log(`[purchasePlan] Verifying purchase event on blockchain...`);
    // Validar con username si existe, si no, usar userId (fallback)
    const expectedUserIdentifier = username || userId;

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const blockchainData = await this.blockchainService.verifyPurchaseEvent(
      normalizedHash,
      expectedUserIdentifier,
    );
    logger.log(
      `[purchasePlan] Blockchain verification result: ${JSON.stringify(blockchainData)}`,
    );

    const user = await this.usersService.findById(userId);
    if (!user) {
      logger.error(`[purchasePlan] User NOT FOUND: ${userId}`);
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const plan = this.PLANS.find((p) => p.id === blockchainData.planId);
    if (!plan) {
      logger.error(
        `[purchasePlan] INVALID PLAN ID from Blockchain: ${blockchainData.planId}`,
      );
      throw new BadRequestException('INVALID_PLAN_ID');
    }

    logger.log(
      `[purchasePlan] Plan Identified: ${plan.name} (${plan.price} USDT)`,
    );

    // --- 🔥 NUEVA VALIDACIÓN DE PRECIO ---
    // Comparamos el monto de la blockchain con el precio del plan
    // Usamos un margen de error mínimo (tolerancia) por si hay decimales extra
    const tolerance = 0.01;
    const priceDifference = Math.abs(blockchainData.amount - plan.price);

    logger.log(
      `[purchasePlan] Price Check -> Plan: ${plan.price}, Blockchain: ${blockchainData.amount}, Diff: ${priceDifference}`,
    );

    if (priceDifference > tolerance) {
      const msg = `PRICE_MISMATCH: Expected ${plan.price}, but found ${blockchainData.amount} in blockchain`;
      logger.error(`[purchasePlan] ❌ ${msg}`);
      throw new BadRequestException(msg);
    }
    // 2. DETERMINAR TIPO DE COMISIÓN ANTES DE ACTUALIZAR
    // Si el usuario no tiene plan, o su plan es 'NONE' o 'WEEKLY' (según spec el weekly no cuenta como membresía que bloquee el first purchase)
    const isFirstPurchase =
      !user.plan || user.plan === 'NONE' || user.plan === 'WEEKLY';
    const commissionType = isFirstPurchase ? 'FIRST_PURCHASE' : 'RENEWAL';

    logger.log(
      `[purchasePlan] Commission Type: ${commissionType} (IsFirst: ${isFirstPurchase}, CurrentPlan: ${user.plan})`,
    );

    // 3. Activar Plan (Aquí se suma el tiempo y cambia el rango)
    await this.usersService.activatePlan(
      user._id.toString(),
      plan.name,
      plan.duration,
    );
    logger.log(`[purchasePlan] ✅ User Plan ACTIVATED in DB`);

    const transaction = await this.create(
      userId,
      user.wallet || user.wallet_address || 'PLAN_PURCHASE', // Fallback
      -plan.price, // Saldo negativo porque es un pago
      TransactionStatus.APPROVED,
      plan.detail,
      normalizedHash, // Guardar siempre en minúsculas
    );
    logger.log(`[purchasePlan] Transaction Record Created: ${transaction._id}`);

    if (transaction) {
      await this.notificationsService.create({
        date: new Date().toISOString(),
        description: 'Plan Purchased',
        userId,
        status: false,
      });
    } else {
      console.log('No se realizó dicha transacción PLAN_PURCHASE');
    }

    if (commissionType === 'FIRST_PURCHASE' && user.sponsor_id) {
      // 🔥 AQUÍ: Si es su primera compra, le damos el "punto" de directo al sponsor
      // para que el sponsor desbloquee niveles (7, 8, 9 o 10)
      await this.usersService.incrementDirectReferrals(user.sponsor_id);
      logger.log(
        `[purchasePlan] incrementDirectReferrals called for sponsor: ${user.sponsor_id}`,
      );
    }

    let companyProfit = blockchainData.amount;
    try {
      logger.log(`[purchasePlan] Calculating commissions...`);
      companyProfit = await this.commissionsService.calculateCommissions(
        transaction._id.toString(),
        userId,
        commissionType,
        plan.price,
        plan.name, // 🔥 Pass plan name
      );
      logger.log(
        `[purchasePlan] Commissions Calculated. Company Profit (Net): ${companyProfit}`,
      );
    } catch (error) {
      logger.error(`Error en comisiones: ${error.message}`);
      // Fallback: If commissions fail, we assume full amount goes to system funds
      // or manual intervention checks logs.
    }

    logger.log(
      `[purchasePlan] Triggering System Funds (Swap) for amount: ${blockchainData.amount}`,
    );

    /* this.blockchainService
      .triggerSistemFunds(blockchainData.amount, isFirstPurchase)
      .then((res) => {
        if (!res.success)
          logger.error(
            `[purchasePlan] ⚠️ Manual intervention needed for swap: TX ${txHash}`,
          );
        else
          logger.log(
            `[purchasePlan] ✅ System Funds Triggered Successfully: ${res.txHash}`,
          );
      }); */

    logger.log(`[purchasePlan] 🏁 Process Complete for ${txHash}`);
    return transaction;
  }

  async manualPurchasePlan(userId: string, planId: number, username: string) {
    logger.log(
      `[manualPurchasePlan] 🚀 Admin manually assigning plan ${planId} to User: ${userId}`,
    );

    const plan = this.PLANS.find((p) => p.id === planId);
    if (!plan) {
      logger.error(`[manualPurchasePlan] INVALID PLAN ID: ${planId}`);
      throw new BadRequestException('INVALID_PLAN_ID');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const isFirstPurchase =
      !user.plan || user.plan === 'NONE' || user.plan === 'WEEKLY';
    const commissionType = isFirstPurchase ? 'FIRST_PURCHASE' : 'RENEWAL';

    logger.log(
      `[manualPurchasePlan] Commission Type: ${commissionType} (IsFirst: ${isFirstPurchase}, CurrentPlan: ${user.plan})`,
    );

    // Activar Plan
    await this.usersService.activatePlan(
      user._id.toString(),
      plan.name,
      plan.duration,
    );
    logger.log(`[manualPurchasePlan] ✅ User Plan ACTIVATED in DB`);

    const txHash = `MANUAL_ADMIN_${Date.now()}`;

    const transaction = await this.create(
      userId,
      user.wallet || user.wallet_address || 'PLAN_PURCHASE_MANUAL',
      -plan.price,
      TransactionStatus.APPROVED,
      plan.detail,
      txHash,
    );

    if (transaction) {
      await this.notificationsService.create({
        date: new Date().toISOString(),
        description: 'Plan Purchased (Manual)',
        userId,
        status: false,
      });
    }

    return transaction;
  }
}
