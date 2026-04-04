import {
  Body,
  Controller,
  Delete,
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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { requireUserId } from '../auth/utils/require-user-id';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsDto) {
    return this.productsService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Post()
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.productsService.create(dto, requireUserId(user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.productsService.update(id, dto, requireUserId(user));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserContext) {
    return this.productsService.remove(id, requireUserId(user));
  }
}
