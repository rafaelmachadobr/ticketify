import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AppModule } from '../src/app.module'
import { User } from '../src/users/user.entity'
import { RefreshToken } from '../src/auth/refresh-token.entity'

const TEST_EMAIL = 'integration-test@ticketify.com'
const TEST_PASSWORD = 'testpass123'
const TEST_NAME = 'Integration Test User'

describe('Auth (e2e)', () => {
  let app: INestApplication
  let userRepo: Repository<User>
  let refreshTokenRepo: Repository<RefreshToken>

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    )
    await app.init()

    userRepo = module.get(getRepositoryToken(User))
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken))
  })

  afterAll(async () => {
    await cleanupTestUser()
    await app.close()
  })

  beforeEach(async () => {
    await cleanupTestUser()
  })

  async function cleanupTestUser() {
    const user = await userRepo.findOne({ where: { email: TEST_EMAIL } })
    if (user) {
      await refreshTokenRepo.delete({ userId: user.id })
      await userRepo.delete({ id: user.id })
    }
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('cria um novo usuário e retorna tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201)

      expect(res.body.user.email).toBe(TEST_EMAIL)
      expect(res.body.user.password).toBeUndefined()
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
    })

    it('retorna 409 para e-mail já cadastrado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201)

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(409)
    })

    it('retorna 400 para body inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: TEST_EMAIL })
        .expect(400)
    })
  })

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
    })

    it('autentica com credenciais válidas e retorna tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200)

      expect(res.body.user.email).toBe(TEST_EMAIL)
      expect(res.body.user.password).toBeUndefined()
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
    })

    it('retorna 401 para senha incorreta', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' })
        .expect(401)
    })

    it('retorna 401 para e-mail não cadastrado', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'naoexiste@ticketify.com', password: TEST_PASSWORD })
        .expect(401)
    })
  })

  // ─── Refresh ──────────────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
      refreshToken = res.body.refreshToken
    })

    it('emite novos tokens a partir de um refresh token válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.refreshToken).not.toBe(refreshToken)
    })

    it('retorna 401 ao reusar um refresh token já rotacionado', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401)
    })

    it('retorna 401 para token inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'tokeninvalido' })
        .expect(401)
    })
  })

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    let refreshToken: string

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
      refreshToken = res.body.refreshToken
    })

    it('invalida o refresh token e retorna 200', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204)
    })

    it('após logout, refresh com o mesmo token retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204)

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401)
    })
  })

  // ─── /me ──────────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    let accessToken: string

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD })
      accessToken = res.body.accessToken
    })

    it('retorna o perfil do usuário autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(res.body.email).toBe(TEST_EMAIL)
      expect(res.body.password).toBeUndefined()
    })

    it('retorna 401 sem token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401)
    })

    it('retorna 401 com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer tokeninvalido')
        .expect(401)
    })
  })

  // ─── JWKS ─────────────────────────────────────────────────────────────────

  describe('GET /auth/.well-known/jwks.json', () => {
    it('retorna a chave pública RS256 no formato JWKS', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/.well-known/jwks.json')
        .expect(200)

      expect(res.body.keys).toBeDefined()
      expect(res.body.keys).toHaveLength(1)

      const key = res.body.keys[0]
      expect(key.kty).toBe('RSA')
      expect(key.alg).toBe('RS256')
      expect(key.use).toBe('sig')
      expect(key.kid).toBe('ticketify-auth-service')
      expect(key.n).toBeDefined()
      expect(key.e).toBeDefined()
    })
  })
})
