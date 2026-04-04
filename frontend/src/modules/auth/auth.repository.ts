import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { users } from '../../database/schema';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager';
}

@Injectable()
export class AuthRepository {
  constructor(@Inject('DRIZZLE') private readonly db: DrizzleDB) {}

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<Omit<UserRecord, 'password'>> {
    const [user] = await this.db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        password: input.password,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    return user;
  }
}
