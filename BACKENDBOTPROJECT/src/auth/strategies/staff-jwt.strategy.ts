import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StaffService } from '../../staff/staff.service';

@Injectable()
export class StaffJwtStrategy extends PassportStrategy(Strategy, 'staff-jwt') {
  constructor(
    private configService: ConfigService,
    private staffService: StaffService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'staff') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.staffService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Staff not found or inactive');
    }
    return user;
  }
}
