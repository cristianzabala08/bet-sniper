import {
  Injectable,
  Logger,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Signal, SignalDocument } from './schemas/signal.schema';
import { UsersService } from '../users/users.service';
import { SignalsGateway } from './signals.gateway';
import axios from 'axios';

@Injectable()
export class SignalsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SignalsService.name);
  private staleCleanupInterval: ReturnType<typeof setInterval>;

  private static readonly STALE_SIGNAL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes

  // Additional gateways that receive signal updates (e.g., genesis gateway)
  private additionalGateways: Array<{ emitUpdate: (data: any) => void }> = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Signal.name) private signalModel: Model<SignalDocument>,
    private readonly usersService: UsersService,
    private readonly gateway: SignalsGateway,
  ) {}

  onModuleInit() {
    this.startStaleSignalCleanup();
  }

  onModuleDestroy() {
    if (this.staleCleanupInterval) {
      clearInterval(this.staleCleanupInterval);
    }
  }

  private startStaleSignalCleanup() {
    this.logger.log(
      `Stale signal cleanup scheduled every ${SignalsService.CLEANUP_INTERVAL_MS / 1000}s`,
    );
    this.staleCleanupInterval = setInterval(async () => {
      try {
        await this.closeStaleSignals();
      } catch (e) {
        this.logger.error(`[Cleanup] Error closing stale signals: ${e.message}`);
      }
    }, SignalsService.CLEANUP_INTERVAL_MS);
  }

  async closeStaleSignals(): Promise<number> {
    const staleThreshold = new Date(
      Date.now() - SignalsService.STALE_SIGNAL_TIMEOUT_MS,
    );
    const result = await this.signalModel.updateMany(
      { tipo: 'SIGNAL', isOpen: true, createdAt: { $lt: staleThreshold } },
      { isOpen: false, win: false },
    );
    if (result.modifiedCount > 0) {
      this.logger.warn(
        `[Cleanup] Auto-cerradas ${result.modifiedCount} señales atascadas (>10 min)`,
      );
    }
    const resultFix = await this.signalModel.updateMany(
      { tipo: 'RESULT', isOpen: true },
      { isOpen: false },
    );
    if (resultFix.modifiedCount > 0) {
      this.logger.warn(
        `[Cleanup] Corregidos ${resultFix.modifiedCount} resultados con isOpen=true`,
      );
    }
    return result.modifiedCount;
  }

  /**
   * Register an additional gateway to receive signal updates.
   * Used by GenesisSignalsGateway to receive the same updates.
   */
  registerAdditionalGateway(gw: { emitUpdate: (data: any) => void }) {
    this.additionalGateways.push(gw);
    this.logger.log(
      `Additional gateway registered. Total: ${this.additionalGateways.length}`,
    );
  }

  private emitToAll(data: any) {
    this.gateway.emitUpdate(data);
    for (const gw of this.additionalGateways) {
      try {
        gw.emitUpdate(data);
      } catch (e) {
        this.logger.error(`Error emitting to additional gateway: ${e.message}`);
      }
    }
  }

  // signals.service.ts
  async processBaccaratLogic(payload: any) {
    const isResult = !!payload.results;
    const isSignal = !!payload.signal;
    const mesaNombre = isResult
      ? payload.results.nombre_mesa
      : payload.signal?.nombre_mesa;
    const rondaActual = isResult
      ? payload.results.ronda_actual
      : payload.signal?.ronda_actual;

    if (isSignal) {
      await this.closeStaleSignals();

      // No guardar más señales hasta que la anterior en la MISMA MESA esté cerrada
      const existingOpen = await this.signalModel.findOne({
        mesa: mesaNombre,
        tipo: 'SIGNAL',
        isOpen: true,
      });

      if (existingOpen) {
        this.logger.warn(
          `Señal ignorada: Ya existe una señal abierta en la mesa ${mesaNombre}`,
        );
        return null;
      }

      const savedSignal = await new this.signalModel({
        data: payload,
        mesa: mesaNombre,
        tipo: 'SIGNAL',
        ronda: rondaActual,
        win: null,
        isOpen: true,
      }).save();

      // OPTIMIZATION: Emit only the new signal, not the full dashboard
      this.emitToAll({ type: 'NEW_SIGNAL', data: savedSignal });

      return savedSignal;
    }

    if (isResult) {
      // Buscar la señal abierta que corresponde a este resultado
      const activeSignal = await this.signalModel.findOne({
        mesa: mesaNombre,
        tipo: 'SIGNAL',
        isOpen: true,
      });

      if (!activeSignal) {
        this.logger.warn(
          `Resultado ignorado: No hay señal abierta para la mesa ${mesaNombre}`,
        );
        return null;
      }

      // Detectar si la última acción fue victoria, derrota o empate
      const martingala = payload.results?.mesa_info?.martingala;
      const vWin = martingala?.vector_win || [];
      const isActive = martingala?.martingala_active;

      let winStatus: boolean | null = null;
      if (vWin.includes('W')) {
        winStatus = true;
      } else if (vWin.filter((r) => r === 'L').length >= 6) {
        winStatus = false;
      } else if (isActive === false || martingala?.martingala === false) {
        // Si la martingala ya no está activa y no hubo victoria, es derrota
        winStatus = false;
      }

      const savedSignal = await new this.signalModel({
        data: payload,
        mesa: mesaNombre,
        tipo: 'RESULT',
        ronda: rondaActual,
        win: winStatus,
        isOpen: false,
      }).save();

      // Si el resultado es final (ganó o perdió), cerramos la señal
      if (winStatus !== null) {
        await this.signalModel.updateOne(
          { _id: activeSignal._id },
          {
            isOpen: false,
            win: winStatus,
            winStep: martingala?.contador_martingala,
          },
        );
      }

      // OPTIMIZATION: Emit only the result, not the full dashboard
      this.emitToAll({
        type: 'NEW_RESULT',
        data: savedSignal,
        winStatus,
        martingalaData: martingala,
      });

      return savedSignal;
    }
  }

  async getDailySignals(userId?: string) {
    if (userId) {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // Validación de membresía activa
      if (
        !user.membership_expiration ||
        new Date(user.membership_expiration) < new Date()
      ) {
        throw new ForbiddenException('Membership expired or not active');
      }
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Obtener todas las señales del día actual
    const dailySignals = await this.signalModel
      .find({
        createdAt: { $gte: hoy },
        tipo: 'RESULT',
        win: { $ne: null },
      })
      .sort({ createdAt: -1 })
      .exec();

    return dailySignals;
  }

  async getDashboardStatsByUser(userId?: string): Promise<any> {
    /*  if (userId) {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // Validación de membresía activa
      if (
        !user.membership_expiration ||
        new Date(user.membership_expiration) < new Date()
      ) {
        throw new ForbiddenException('Membership expired or not active');
      }
    } */

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 1. Estadísticas globales del día
    const [wins, losses] = await Promise.all([
      this.signalModel.countDocuments({
        tipo: 'RESULT',
        win: true,
        createdAt: { $gte: hoy },
      }),
      this.signalModel.countDocuments({
        tipo: 'RESULT',
        win: false,
        createdAt: { $gte: hoy },
      }),
    ]);

    // 2. MESA MÁS RECIENTE (Panel Principal) -> La señal más reciente (Priorizando la abierta)
    let latestSignal = await this.signalModel
      .findOne({ tipo: 'SIGNAL', isOpen: true })
      .sort({ createdAt: -1 })
      .exec();

    // Si no hay ninguna abierta, tomamos la última que se guardó
    if (!latestSignal) {
      latestSignal = await this.signalModel
        .findOne({ tipo: 'SIGNAL' })
        .sort({ createdAt: -1 })
        .exec();
    }

    let latestResult: any = null;
    let previousSignal: any = null;

    if (latestSignal) {
      // 3. Resultado más reciente DE LA MISMA MESA
      latestResult = await this.signalModel
        .findOne({ tipo: 'RESULT', mesa: latestSignal.mesa })
        .sort({ createdAt: -1 })
        .exec();

      // 4. Señal anterior a la más reciente DE LA MISMA MESA (para comparar)
      previousSignal = await this.signalModel
        .findOne({ tipo: 'SIGNAL', mesa: latestSignal.mesa })
        .sort({ createdAt: -1 })
        .skip(1)
        .exec();
    }

    // 5. LISTA DE SEÑALES (Solo señales)
    const ultimasSignals = await this.signalModel
      .find({ tipo: 'SIGNAL' })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
      .exec();

    // Enriquecer las señales con el resultado (si existe)
    // "de la ultima 6 senales exeto la primera porque esta seria la que se esta jugando"
    const processedSignals = await Promise.all(
      ultimasSignals.map(async (sig, index) => {
        // Si la señal está abierta, es la que se está jugando actualmente
        if (sig.isOpen) {
          return { ...sig, win: null };
        }

        // 1. Buscar la SIGUIENTE señal en esa misma mesa para poner un límite de tiempo
        // (Queremos el resultado que ocurrió DESPUÉS de esta señal pero ANTES de la siguiente señal en esa mesa)
        const nextSignalSameTable = await this.signalModel
          .findOne({
            tipo: 'SIGNAL',
            mesa: sig.mesa,
            createdAt: { $gt: (sig as any).createdAt },
          })
          .sort({ createdAt: 1 }) // La más cercana en el futuro
          .exec();

        // 2. Construir la query para buscar el resultado
        const resultQuery: any = {
          tipo: 'RESULT',
          mesa: sig.mesa,
          createdAt: { $gt: (sig as any).createdAt },
        };

        if (nextSignalSameTable) {
          // Si hubo otra señal después, el resultado debe ser anterior a esa nueva señal
          resultQuery.createdAt.$lt = (nextSignalSameTable as any).createdAt;
        }

        // 3. Obtener el ÚLTIMO resultado de esa secuencia (el que define si ganó o perdió)
        const result = await this.signalModel
          .findOne(resultQuery)
          .sort({ createdAt: -1 }) // El último de la secuencia
          .exec();

        let duration: string | null = null;
        let winTime: Date | null = null; // "Fechas de cuando gano"

        if (result) {
          const signalTime = new Date((sig as any).createdAt).getTime();
          const resultTime = new Date((result as any).createdAt).getTime();
          const diffMs = resultTime - signalTime;

          if (diffMs > 0) {
            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);
            duration = `${diffMins}m ${diffSecs}s`;
          }
          winTime = (result as any).createdAt;
        }

        return {
          ...sig,
          win: result ? result.win : null,

          winStep: (sig as any).winStep,
          duration,
          winTime,
        };
      }),
    );

    return {
      barraSuperior: {
        wins,
        losses,
        profit: wins * 0.95 - losses,
        winPercentage: (wins + losses > 0
          ? (wins / (wins + losses)) * 100
          : 0
        ).toFixed(2),
      },
      panelPrincipal: latestSignal,
      ultimoResult: latestResult?.data?.results?.mesa_info?.martingala,
      previousSignal: previousSignal,
      listaMesas: processedSignals,
      tableInfo: latestResult?.data?.results?.mesa_info,
    };
  }
}
