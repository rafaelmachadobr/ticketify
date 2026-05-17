import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as crypto from 'crypto'

@Injectable()
export class JwksService implements OnModuleInit {
  private jwks: { keys: object[] }

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const pubKeyPath = this.config.get<string>('JWT_PUBLIC_KEY_PATH', './keys/public.pem')
    const pem = fs.readFileSync(pubKeyPath, 'utf8')
    const keyObject = crypto.createPublicKey(pem)
    const jwk = keyObject.export({ format: 'jwk' }) as Record<string, string>

    this.jwks = {
      keys: [
        {
          kty: jwk.kty,
          use: 'sig',
          alg: 'RS256',
          kid: 'ticketify-auth-service',
          n: jwk.n,
          e: jwk.e,
        },
      ],
    }
  }

  getJwks() {
    return this.jwks
  }
}
