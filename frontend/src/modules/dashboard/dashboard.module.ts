import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [OrdersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
