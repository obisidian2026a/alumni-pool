import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserContext {
  id: string;
  email: string;
  role: 'admin' | 'manager';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserContext | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: CurrentUserContext }>();
    return request.user;
  },
);
