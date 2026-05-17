import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwksService } from './jwks.service'
import { JwtStrategy } from './jwt.strategy'
import { RefreshToken } from './refresh-token.entity'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const privKeyPath = config.get<string>('JWT_PRIVATE_KEY_PATH', './keys/private.pem')
        const expiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as `${number}${'s'|'m'|'h'|'d'}`
        return {
          privateKey: fs.readFileSync(privKeyPath, 'utf8'),
          signOptions: {
            algorithm: 'RS256' as const,
            expiresIn,
            issuer: 'ticketify',
            keyid: 'ticketify-auth-service',
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwksService, JwtStrategy],
})
export class AuthModule {}
