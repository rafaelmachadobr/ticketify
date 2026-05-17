import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne()
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id })
  }

  create(data: Pick<User, 'name' | 'email' | 'password'>): Promise<User> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, data: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    await this.repo.update(id, data)
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('Usuário não encontrado')
    return user
  }
}
