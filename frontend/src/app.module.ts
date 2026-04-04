import { Module } from '@nestjs/common';
import { DrizzleModule } from './database/drizzle.moduile';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivityModule } from './modules/activity/activity.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RestockModule } from './modules/restock/restock.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    AuthModule,
    ActivityModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    RestockModule,
    DashboardModule,
    AdminModule,
  ],
})
export class AppModule {}
