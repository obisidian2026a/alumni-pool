import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [ActivityModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
