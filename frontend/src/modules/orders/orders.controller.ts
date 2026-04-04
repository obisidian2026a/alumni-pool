import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserContext,
} from '../auth/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import { requireUserId } from '../auth/utils/require-user-id';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.ordersService.create(dto, requireUserId(user));
  }

  @Get()
  list(@Query() query: ListOrdersDto) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.ordersService.update(id, dto, requireUserId(user));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.ordersService.updateStatus(id, dto.status, requireUserId(user));
  }
}
