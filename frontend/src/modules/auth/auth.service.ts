import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthRepository } from './auth.repository';
import type { AuthPayload, AuthResponse } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const existing = await this.authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.authRepository.createUser({
      name,
      email,
      password: passwordHash,
    });

    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
