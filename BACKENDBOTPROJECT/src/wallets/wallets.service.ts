import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class WalletsService {
  constructor(private usersService: UsersService) {}

  async setWalletAddress(userId: string, walletAddress: string): Promise<void> {
    await this.usersService.setWalletAddress(userId, walletAddress);
  }
}
