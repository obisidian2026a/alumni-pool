import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { products } from '../../database/schema';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class RestockService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleDB,
    private readonly activityService: ActivityService,
  ) {}

  private getPriority(
    stock: number,
    threshold: number,
  ): 'high' | 'medium' | 'low' {
    if (stock === 0) {
      return 'high';
    }

    if (stock <= Math.max(1, Math.floor(threshold / 2))) {
      return 'medium';
    }

    return 'low';
  }

  async list() {
    const rows = await this.db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        minThreshold: products.minThreshold,
        status: products.status,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(sql`${products.stock} < ${products.minThreshold}`)
      .orderBy(asc(products.stock), asc(products.updatedAt));

    return rows.map((row) => ({
      ...row,
      priority: this.getPriority(row.stock, row.minThreshold),
    }));
  }

  async restock(productId: string, quantity: number, actorUserId?: string) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const nextStock = product.stock + quantity;
    const nextStatus = nextStock === 0 ? 'out_of_stock' : 'active';

    const [updated] = await this.db
      .update(products)
      .set({
        stock: nextStock,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'STOCK_UPDATED',
      entityType: 'product',
      entityId: productId,
      metadata: { previousStock: product.stock, stock: nextStock },
    });

    return {
      ...updated,
      inQueue: nextStock < updated.minThreshold,
      priority:
        nextStock < updated.minThreshold
          ? this.getPriority(nextStock, updated.minThreshold)
          : null,
    };
  }
}
