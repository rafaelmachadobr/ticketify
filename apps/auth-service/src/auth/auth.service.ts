import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { UsersService } from '../users/users.service'
import { RefreshToken } from './refresh-token.entity'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('E-mail já cadastrado')

    const hashed = await bcrypt.hash(dto.password, 12)
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
    })

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    return { user: this.sanitize(user), ...tokens }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Credenciais inválidas')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Credenciais inválidas')

    const tokens = await this.issueTokens(user.id, user.email, user.role)
    return { user: this.sanitize(user), ...tokens }
  }

  async refresh(rawToken: string) {
    if (!rawToken) throw new UnauthorizedException('Refresh token inválido ou expirado')
    const tokenHash = this.hashToken(rawToken)
    const record = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    })

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    await this.refreshTokenRepo.delete(record.id)

    const tokens = await this.issueTokens(
      record.user.id,
      record.user.email,
      record.user.role,
    )
    return tokens
  }

  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken)
    await this.refreshTokenRepo.delete({ tokenHash })
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role }
    const accessToken = await this.jwtService.signAsync(payload)

    const rawRefresh = crypto.randomBytes(64).toString('hex')
    const tokenHash = this.hashToken(rawRefresh)
    const days = parseInt(this.config.get('JWT_REFRESH_EXPIRES_IN', '7'), 10)
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({ userId, tokenHash, expiresAt }),
    )

    return { accessToken, refreshToken: rawRefresh }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private sanitize(user: any) {
    const { password, ...rest } = user
    return rest
  }
}
