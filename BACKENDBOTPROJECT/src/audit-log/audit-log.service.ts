import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schema/audit-log.schema';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponsePagintationDto } from '../common/dto/responseApisDto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: {
    action: string;
    module: string;
    performedBy: string;
    targetId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      const log = new this.auditLogModel(entry);
      await log.save();
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  async findAll(filter: any = {}, limit = 50, skip = 0) {
    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.auditLogModel.countDocuments(filter);

    return { data: logs, total };
  }

  async findByPagination(
    paginationDto: PaginationDto,
    filter: any = {},
  ): Promise<ResponsePagintationDto<AuditLog[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.auditLogModel.countDocuments(filter);

    return {
      rows: logs,
      totalRow: total,
    };
  }
}
