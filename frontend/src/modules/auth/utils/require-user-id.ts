import { UnauthorizedException } from '@nestjs/common';
import type { CurrentUserContext } from '../decorators/current-user.decorator';

export function requireUserId(user?: CurrentUserContext): string {
  if (!user?.id) {
    throw new UnauthorizedException('Authentication required');
  }

  return user.id;
}
