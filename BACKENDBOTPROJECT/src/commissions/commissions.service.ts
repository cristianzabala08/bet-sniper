import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Commission } from './schema/commission.schema';
import { UsersService } from '../users/users.service';
import { Inject, forwardRef } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionDetail } from '../transactions/enums/transaction-detail.enum';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(Commission.name)
    private commissionModel: Model<Commission>,
    private usersService: UsersService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
    private notificationsService: NotificationsService,
  ) {}

  async findAllPaginated(
    filter: any = {},
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const commissions = await this.commissionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('receiver_id', 'username email')
      .exec();

    const total = await this.commissionModel.countDocuments(filter);
    return { data: commissions, total };
  }

  // Definición de porcentajes según el documento
  private FIRST_PURCHASE_CONFIG = {
    1: 17,
    2: 5,
    3: 2.5,
    4: 1.5,
    5: 1,
    6: 1,
  };
  private RENEWAL_CONFIG = {
    1: 15,
    2: 3,
    3: 2,
    4: 1,
    5: 1,
    6: 1,
  };

  async calculateCommissions(
    transactionId: string,
    userId: string,
    type: 'FIRST_PURCHASE' | 'RENEWAL' | 'UPGRADE',
    amount: number,
    planName: string, // 🔥 Received plan name
  ): Promise<number> {
    let totalDistributed = 0;
    // Según el spec, UPGRADE suele tratarse como compra inicial o renovación.
    // Aquí asumo FIRST_PURCHASE para UPGRADES según lógica común de MLM.
    const percentages =
      type === 'FIRST_PURCHASE' || type === 'UPGRADE'
        ? this.FIRST_PURCHASE_CONFIG
        : this.RENEWAL_CONFIG;

    const user = await this.usersService.findOneById(userId);
    if (!user || !user.referredBy) return amount;

    let currentSponsorUsername = user.referredBy;
    let level = 1;

    // Determine Transaction Detail based on type (Renewal vs First Purchase)
    const transactionDetail =
      type === 'RENEWAL'
        ? TransactionDetail.NETWORK_COMMISSION_RENEWAL
        : TransactionDetail.NETWORK_COMMISSION;

    while (level <= 6) {
      const upline = await this.usersService.findOne(currentSponsorUsername);
      if (!upline) break;

      let status = 'approved';
      let reason = '';

      // 1. VALIDACIÓN: Membresía Activa
      const isActive =
        upline.status === 'active' &&
        upline.membership_expiration &&
        new Date(upline.membership_expiration) > new Date();

      if (!isActive) {
        status = 'skipped';
        reason = 'Inactive membership';
      }

      // 2. VALIDACIÓN: Nivel máximo según Plan (Membership Tier)
      const maxPayableLevel = this.getMaxPayableLevel(upline.plan);
      if (status === 'approved' && level > maxPayableLevel) {
        status = 'skipped';
        reason = `Plan ${upline.plan} limits to level ${maxPayableLevel}`;
      }

      // 3. VALIDACIÓN: Profundidad por Referidos Directos
      // Spec: 0 dir -> L1-6, 1 dir -> L7, 2 dir -> L8, 3 dir -> L9, 4 dir -> L10
      const requiredDirects = Math.max(0, level - 3);
      if (
        status === 'approved' &&
        upline.direct_referrals_count < requiredDirects
      ) {
        status = 'skipped';
        reason = `Required directs: ${requiredDirects}, has: ${upline.direct_referrals_count}`;
      }

      const percentage = percentages[level];
      const commissionAmount = amount * (percentage / 100);

      if (status === 'approved') {
        // Acreditar al Upline
        await this.usersService.updatePoints(
          upline._id.toString(),
          commissionAmount,
        );
        totalDistributed += commissionAmount;

        await this.transactionsService.create(
          upline._id.toString(),
          `Commission ${planName} L${level}`, // 🔥 Custom Type: "Commission Basic L1"
          commissionAmount,
          TransactionStatus.APPROVED,
          transactionDetail, // 🔥 Custom Detail: NETWORK_COMMISSION or NETWORK_COMMISSION_RENEWAL
          `COM-${transactionId}-L${level}`,
        );

        await this.notificationsService.create({
          date: new Date().toISOString(),
          description: 'Commission',
          userId: upline._id.toString(),
          status: false,
        });
      } else {
        /** * NOTA: El documento dice "percentage goes to company".
         * Podrías registrar esto en una cuenta de 'COMPANY_REVENUE' para auditoría.
         **/
        await this.transactionsService.create(
          'COMPANY_SYSTEM_ID',
          'COMPANY_REVENUE',
          commissionAmount,
          TransactionStatus.APPROVED,
          transactionDetail,
          `SKIP-${transactionId}-L${level}`,
        );
      }

      // Log de la comisión (Auditoría)
      await this.commissionModel.create({
        transaction_id: transactionId,
        receiver_id: upline._id.toString(),
        level,
        percentage,
        amount: commissionAmount,
        validation_status: status,
        reason_if_rejected: reason,
      });

      if (!upline.referredBy) break;
      currentSponsorUsername = upline.referredBy;
      level++;
    }

    // Return the amount remaining for the company
    return amount - totalDistributed;
  }

  private getMaxPayableLevel(plan: string): number {
    const levels = {
      WEEKLY: 3, // Pays up to 6th level
      BASIC: 3,
      AMATEUR: 4,
      PRO: 5,
      EXPERT: 6,
      ELITE: 6,
      NONE: 0,
    };
    return levels[plan] || 0;
  }
}
