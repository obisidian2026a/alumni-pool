import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserContext,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { requireUserId } from '../auth/utils/require-user-id';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private ensureAdmin(user?: CurrentUserContext) {
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admin can access this resource');
    }
  }

  @Get('users')
  listUsers(@CurrentUser() user?: CurrentUserContext) {
    this.ensureAdmin(user);
    return this.adminService.listUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: 'admin' | 'manager',
    @CurrentUser() user?: CurrentUserContext,
  ) {
    this.ensureAdmin(user);
    return this.adminService.updateUserRole(userId, role, requireUserId(user));
  }

  @Public()
  @Post('seed-reset')
  seedReset() {
    return this.adminService.resetAndSeed();
  }
}
