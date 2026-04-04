import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, lt, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { orders, products } from '../../database/schema';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleDB,
    private readonly ordersService: OrdersService,
  ) {}

  async getSummary() {
    const orderMetrics = await this.ordersService.getMetricsForToday();

    const [lowStockRow] = await this.db
      .select({ total: count() })
      .from(products)
      .where(lt(products.stock, products.minThreshold));

    const productSummary = await this.db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        minThreshold: products.minThreshold,
        status: products.status,
      })
      .from(products)
      .orderBy(asc(sql`${products.stock} - ${products.minThreshold}`))
      .limit(8);

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const chartRows = await this.db
      .select({
        hour: sql<string>`TO_CHAR(${orders.createdAt}, 'HH24:00')`,
        totalOrders: count(),
        revenue: sql<string>`COALESCE(SUM(${orders.totalPrice}), '0')`,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.createdAt} >= ${start}`,
          sql`${orders.status} != 'cancelled'`,
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'HH24:00')`)
      .orderBy(asc(sql`TO_CHAR(${orders.createdAt}, 'HH24:00')`));

    return {
      ...orderMetrics,
      lowStockItemsCount: lowStockRow.total,
      productSummary: productSummary.map((item) => ({
        ...item,
        label: item.stock < item.minThreshold ? 'Low Stock' : 'OK',
      })),
      orderRevenueChart: chartRows.map((row) => ({
        hour: row.hour,
        totalOrders: row.totalOrders,
        revenue: Number(row.revenue),
      })),
    };
  }
}
