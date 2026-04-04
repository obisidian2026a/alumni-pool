import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { orderItems, orders, products } from '../../database/schema';
import { ActivityService } from '../activity/activity.service';
import { CreateOrderDto, OrderItemInputDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleDB,
    private readonly activityService: ActivityService,
  ) {}

  private getUniqueProductIds(items: OrderItemInputDto[]) {
    const ids = items.map((item) => item.productId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException(
        'This product is already added to the order.',
      );
    }

    return [...unique];
  }

  private async loadProductsForOrder(productIds: string[]) {
    const rows = await this.db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        minThreshold: products.minThreshold,
        status: products.status,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (rows.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    return new Map(rows.map((row) => [row.id, row]));
  }

  private validateProductAvailability(
    map: Map<
      string,
      {
        id: string;
        name: string;
        price: string;
        stock: number;
        minThreshold: number;
        status: 'active' | 'out_of_stock';
      }
    >,
    items: OrderItemInputDto[],
  ) {
    for (const item of items) {
      const product = map.get(item.productId);
      if (!product || product.status !== 'active') {
        throw new BadRequestException('This product is currently unavailable.');
      }

      if (item.quantity > product.stock) {
        throw new BadRequestException(
          `Only ${product.stock} items available in stock for "${product.name}".`,
        );
      }
    }
  }

  private buildTotal(
    map: Map<string, { price: string }>,
    items: OrderItemInputDto[],
  ): string {
    const total = items.reduce((acc, item) => {
      const product = map.get(item.productId);
      if (!product) {
        return acc;
      }

      return acc + Number(product.price) * item.quantity;
    }, 0);

    return total.toFixed(2);
  }

  async create(dto: CreateOrderDto, actorUserId: string) {
    const uniqueProductIds = this.getUniqueProductIds(dto.items);
    const productMap = await this.loadProductsForOrder(uniqueProductIds);
    this.validateProductAvailability(productMap, dto.items);

    const totalPrice = this.buildTotal(productMap, dto.items);

    const [created] = await this.db
      .insert(orders)
      .values({
        customerName: dto.customerName.trim(),
        userId: actorUserId,
        status: 'confirmed',
        totalPrice,
      })
      .returning();

    await this.db.insert(orderItems).values(
      dto.items.map((item) => {
        const product = productMap.get(item.productId)!;

        return {
          orderId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.price).toFixed(2),
        };
      }),
    );

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      const nextStock = product.stock - item.quantity;

      await this.db
        .update(products)
        .set({
          stock: nextStock,
          status: nextStock === 0 ? 'out_of_stock' : 'active',
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      if (nextStock < product.minThreshold) {
        await this.activityService.logAction({
          userId: actorUserId,
          action: 'RESTOCK_QUEUED',
          entityType: 'product',
          entityId: product.id,
          metadata: {
            name: product.name,
            stock: nextStock,
            minThreshold: product.minThreshold,
          },
        });
      }
    }

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: created.id,
      metadata: {
        customerName: created.customerName,
        totalPrice: created.totalPrice,
      },
    });

    return this.getById(created.id);
  }

  async list(query: ListOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      query.status ? eq(orders.status, query.status) : undefined,
      query.fromDate
        ? gte(orders.createdAt, new Date(query.fromDate))
        : undefined,
      query.toDate ? lte(orders.createdAt, new Date(query.toDate)) : undefined,
    ].filter((value) => value !== undefined);

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(whereClause);

    if (!rows.length) {
      return {
        data: [],
        page,
        limit,
        total: totalRow.total,
        totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
      };
    }

    const orderIds = rows.map((row) => row.id);
    const itemRows = await this.db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(asc(orderItems.orderId));

    const itemsByOrder = itemRows.reduce<Record<string, typeof itemRows>>(
      (acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = [];
        }

        acc[item.orderId].push(item);
        return acc;
      },
      {},
    );

    return {
      data: rows.map((row) => ({
        ...row,
        items: itemsByOrder[row.id] ?? [],
      })),
      page,
      limit,
      total: totalRow.total,
      totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
    };
  }

  async getById(id: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async update(id: string, dto: UpdateOrderDto, actorUserId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      throw new BadRequestException('This order cannot be edited anymore');
    }

    if (!dto.items || !dto.items.length) {
      const [updated] = await this.db
        .update(orders)
        .set({
          customerName: dto.customerName?.trim() ?? order.customerName,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      await this.activityService.logAction({
        userId: actorUserId,
        action: 'ORDER_UPDATED',
        entityType: 'order',
        entityId: id,
      });

      return this.getById(updated.id);
    }

    const uniqueProductIds = this.getUniqueProductIds(dto.items);
    const productMap = await this.loadProductsForOrder(uniqueProductIds);

    const existingItems = await this.db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const adjustedStock = new Map<string, number>();
    for (const [productId, product] of productMap.entries()) {
      adjustedStock.set(productId, product.stock);
    }

    for (const previous of existingItems) {
      adjustedStock.set(
        previous.productId,
        (adjustedStock.get(previous.productId) ?? 0) + previous.quantity,
      );
    }

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== 'active') {
        throw new BadRequestException('This product is currently unavailable.');
      }

      const available = adjustedStock.get(item.productId) ?? product.stock;
      if (item.quantity > available) {
        throw new BadRequestException(
          `Only ${available} items available in stock for "${product.name}".`,
        );
      }
    }

    const totalPrice = this.buildTotal(productMap, dto.items);

    await this.db.delete(orderItems).where(eq(orderItems.orderId, id));

    await this.db.insert(orderItems).values(
      dto.items!.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.price).toFixed(2),
        };
      }),
    );

    const stockByProduct = new Map<string, number>();
    for (const [productId, value] of adjustedStock.entries()) {
      stockByProduct.set(productId, value);
    }

    for (const item of dto.items!) {
      stockByProduct.set(
        item.productId,
        (stockByProduct.get(item.productId) ?? 0) - item.quantity,
      );
    }

    for (const [productId, stock] of stockByProduct.entries()) {
      await this.db
        .update(products)
        .set({
          stock,
          status: stock === 0 ? 'out_of_stock' : 'active',
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }

    await this.db
      .update(orders)
      .set({
        customerName: dto.customerName?.trim() ?? order.customerName,
        totalPrice,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'ORDER_UPDATED',
      entityType: 'order',
      entityId: id,
    });

    return this.getById(id);
  }

  async updateStatus(id: string, status: OrderStatus, actorUserId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'cancelled' && status !== 'cancelled') {
      throw new BadRequestException('Cancelled orders cannot be reopened');
    }

    if (status === order.status) {
      return this.getById(id);
    }

    if (status === 'cancelled') {
      const items = await this.db
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      for (const item of items) {
        const [product] = await this.db
          .select({ id: products.id, stock: products.stock })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          continue;
        }

        const nextStock = product.stock + item.quantity;

        await this.db
          .update(products)
          .set({
            stock: nextStock,
            status: nextStock === 0 ? 'out_of_stock' : 'active',
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      await this.db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id));
    } else {
      await this.db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id));
    }

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'order',
      entityId: id,
      metadata: { status },
    });

    return this.getById(id);
  }

  async getMetricsForToday() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const [ordersToday] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(gte(orders.createdAt, start));

    const [pendingCount] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(inArray(orders.status, ['pending', 'confirmed', 'shipped']));

    const [completedCount] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    const [revenueToday] = await this.db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.totalPrice}), '0')`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, start),
          inArray(orders.status, ['confirmed', 'shipped', 'delivered']),
        ),
      );

    return {
      totalOrdersToday: ordersToday.total,
      pendingOrders: pendingCount.total,
      completedOrders: completedCount.total,
      revenueToday: Number(revenueToday.totalRevenue),
    };
  }
}
