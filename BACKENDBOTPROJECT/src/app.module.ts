import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { SupportModule } from './support/support.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CommissionsModule } from './commissions/commissions.module';
import { WalletsModule } from './wallets/wallets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HoldsModule } from './holds/holds.module';
import { SignalsModule } from './signals/signals.module';
import { StaffModule } from './staff/staff.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { GenesisSignalsModule } from './genesis-signals/genesis-signals.module';
import { GenesisUsersModule } from './genesis-users/genesis-users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ThirdPartySignalsModule } from './third-party-signals/third-party-signals.module';
import { PlansModule } from './plans/plans.module';
import { LandingConfigModule } from './landing-config/landing-config.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Disponible en todo el proyecto
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    UsersModule,
    AuthModule,
    MailModule,
    SupportModule,
    TransactionsModule,
    CommissionsModule,
    CommissionsModule,
    WalletsModule,
    NotificationsModule,
    HoldsModule,
    SignalsModule,
    StaffModule,
    AuditLogModule,
    GenesisSignalsModule,
    GenesisUsersModule,
    ThirdPartySignalsModule,
    PlansModule,
    LandingConfigModule,
    BlogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
