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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { requireUserId } from '../auth/utils/require-user-id';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.categoriesService.list(search);
  }

  @Post()
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.categoriesService.create(dto, requireUserId(user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user?: CurrentUserContext,
  ) {
    return this.categoriesService.update(id, dto, requireUserId(user));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserContext) {
    return this.categoriesService.remove(id, requireUserId(user));
  }
}
