import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthPayload } from '../types/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string; email: string; role: 'admin' | 'manager' };
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    let payload: AuthPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return true;
  }
}
