import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { RefreshToken } from '../auth/refresh-token.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 255, unique: true })
  email: string

  @Column({ length: 255, select: false })
  password: string

  @Column({ length: 50, default: 'user' })
  role: 'user' | 'admin'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[]
}
