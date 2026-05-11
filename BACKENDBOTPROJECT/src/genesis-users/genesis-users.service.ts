import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenesisUser, GenesisUserDocument } from './schema/genesis-user.schema';
import { ActivateGenesisUserDto } from './dto/activate-genesis-user.dto';
import { BlockchainService } from 'src/wallets/blockchain.service';

export interface SignalPlanDefinition {
  id: number;
  name: string;
  price: number;
  duration: number;
  label: string;
}

@Injectable()
export class GenesisUsersService {
  private readonly logger = new Logger(GenesisUsersService.name);

  public readonly PLANS: SignalPlanDefinition[] = [
    { id: 1, name: 'WEEKLY', price: 50, duration: 7, label: '1 Semana' },
    { id: 2, name: 'BASIC', price: 100, duration: 30, label: '1 Mes' },
    { id: 3, name: 'AMATEUR', price: 250, duration: 90, label: '3 Meses' },
    { id: 4, name: 'PRO', price: 500, duration: 180, label: '6 Meses' },
    { id: 5, name: 'EXPERT', price: 750, duration: 270, label: '9 Meses' },
    { id: 6, name: 'ELITE', price: 1000, duration: 365, label: '12 Meses' },
  ];

  constructor(
    @InjectModel(GenesisUser.name)
    private genesisUserModel: Model<GenesisUserDocument>,
    private readonly blockchainService: BlockchainService,
  ) {}

  getPlans(): SignalPlanDefinition[] {
    return this.PLANS;
  }

  getPlanById(planId: number): SignalPlanDefinition | undefined {
    return this.PLANS.find((p) => p.id === planId);
  }

  getPlanByName(planName: string): SignalPlanDefinition | undefined {
    return this.PLANS.find(
      (p) => p.name.toUpperCase() === planName.toUpperCase(),
    );
  }

  async findByGenesisId(
    genesisUserId: string,
  ): Promise<GenesisUserDocument | null> {
    return this.genesisUserModel.findOne({ genesisUserId }).exec();
  }

  async isActive(genesisUserId: string): Promise<boolean> {
    const user = await this.findByGenesisId(genesisUserId);
    if (!user) return false;
    return (
      user.status === 'active' &&
      user.membership_expiration !== null &&
      new Date(user.membership_expiration) > new Date()
    );
  }

  async activatePlan(
    dto: ActivateGenesisUserDto,
  ): Promise<GenesisUserDocument> {
    const { genesisUserId, genesisUsername, genesisEmail, wallet, txHash } =
      dto;

    // 1. Validar Hash
    const normalizedHash = txHash?.toLowerCase();
    if (!normalizedHash) {
      throw new BadRequestException('TX_HASH_REQUIRED');
    }

    // 2. Evitar transacciones duplicadas
    const existingTx = await this.genesisUserModel.findOne({
      lastTxHash: normalizedHash,
    });
    if (existingTx) {
      throw new BadRequestException('DUPLICATE_TRANSACTION');
    }

    // 3. Espera de seguridad y verificación en Blockchain
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const blockchainData =
      await this.blockchainService.verifyPurchaseEventSignal(
        normalizedHash,
        genesisUserId,
      );

    this.logger.log(
      `[activatePlan] Blockchain data: ${JSON.stringify(blockchainData)}`,
    );

    // 4. Buscar el plan en tu configuración local
    const plan = this.PLANS.find((p) => p.id === blockchainData.planId);
    if (!plan) {
      this.logger.error(
        `[activatePlan] INVALID PLAN ID: ${blockchainData.planId}`,
      );
      throw new BadRequestException('INVALID_PLAN_ID');
    }

    // 5. Validar que el monto pagado coincida con el precio del plan
    const tolerance = 0.01;
    const priceDifference = Math.abs(blockchainData.amount - plan.price);
    if (priceDifference > tolerance) {
      throw new BadRequestException(
        `PRICE_MISMATCH: Expected ${plan.price}, found ${blockchainData.amount}`,
      );
    }

    // 6. Lógica de Membresía (Acumulativa)
    let user = await this.findByGenesisId(genesisUserId);
    const now = new Date();
    let newExpiration: Date;

    if (
      user &&
      user.membership_expiration &&
      new Date(user.membership_expiration) > now
    ) {
      // Si tiene plan activo, sumamos a la fecha de vencimiento actual
      newExpiration = new Date(user.membership_expiration);
      newExpiration.setDate(newExpiration.getDate() + plan.duration);
      this.logger.log(
        `[activatePlan] Extending plan for user ${genesisUserId}`,
      );
    } else {
      // Si es nuevo o ya venció, empezamos desde hoy
      newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + plan.duration);
      this.logger.log(
        `[activatePlan] Starting/Renewing plan for user ${genesisUserId}`,
      );
    }

    // 8. Update o Create (Upsert)
    // Usamos findOneAndUpdate con upsert: true para manejar ambos casos en una sola operación
    const updatedUser = await this.genesisUserModel.findOneAndUpdate(
      { genesisUserId },
      {
        $set: {
          genesisUsername,
          genesisEmail: genesisEmail || user?.genesisEmail || '',
          wallet: wallet || user?.wallet || '',
          plan: plan.name.toUpperCase(),
          membership_expiration: newExpiration,
          status: 'active',
          lastTxHash: normalizedHash,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    return updatedUser;
  }
}
