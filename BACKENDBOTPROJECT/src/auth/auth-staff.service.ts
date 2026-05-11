import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { StaffDocument } from '../staff/schema/staff.schema';

@Injectable()
export class AuthStaffService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, pass: string) {
    const user = await this.staffService.findByUsernameForAuth(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      return {
        require2fa: true,
        tempToken: this.jwtService.sign(
          { sub: user._id, is2faHandshake: true },
          { expiresIn: '5m' },
        ),
      };
    }

    return this.generateToken(user);
  }

  async verify2fa(token: string, code: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.is2faHandshake) {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.staffService.findByIdForAuth(payload.sub);
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid user or 2FA not configured');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    return this.generateToken(user);
  }

  private generateToken(user: StaffDocument) {
    const payload = {
      username: user.username,
      sub: user._id,
      role: user.role,
      type: 'staff',
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
