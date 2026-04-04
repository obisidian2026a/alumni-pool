import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ActivityModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
