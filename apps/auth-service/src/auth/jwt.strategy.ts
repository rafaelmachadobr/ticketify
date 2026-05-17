import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const pubKeyPath = config.get<string>('JWT_PUBLIC_KEY_PATH', './keys/public.pem')
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(pubKeyPath, 'utf8'),
      algorithms: ['RS256'],
    })
  }

  validate(payload: { sub: string; email: string; role: string }) {
    return payload
  }
}
