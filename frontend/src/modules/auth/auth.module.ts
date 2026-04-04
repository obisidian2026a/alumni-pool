import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const envExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
        const numericExpiresIn = Number(envExpiresIn);
        const expiresIn: number | StringValue = Number.isFinite(
          numericExpiresIn,
        )
          ? numericExpiresIn
          : ((envExpiresIn as StringValue | undefined) ?? '1d');

        return {
          secret: configService.get<string>('JWT_SECRET') ?? 'dev-only-secret',
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
