import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserContext,
} from '../auth/decorators/current-user.decorator';
import { RestockProductDto } from './dto/restock-product.dto';
import { RestockService } from './restock.service';

@Controller('restock-queue')
export class RestockController {
  constructor(private readonly restockService: RestockService) {}

  @Get()
  list() {
    return this.restockService.list();
  }

  @Patch(':productId/restock')
  restock(
    @Param('productId') productId: string,
    @Body() dto: RestockProductDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.restockService.restock(productId, dto.quantity, user?.id);
  }
}
