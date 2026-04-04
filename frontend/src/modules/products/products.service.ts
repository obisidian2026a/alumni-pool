import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, like, or, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { categories, orderItems, products } from '../../database/schema';
import { ActivityService } from '../activity/activity.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleDB,
    private readonly activityService: ActivityService,
  ) {}

  private normalizeStatus(stock: number, status?: 'active' | 'out_of_stock') {
    if (stock === 0) {
      return 'out_of_stock' as const;
    }

    return status === 'out_of_stock' ? 'active' : (status ?? 'active');
  }

  async create(dto: CreateProductDto, actorUserId?: string) {
    const [category] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, dto.categoryId))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [created] = await this.db
      .insert(products)
      .values({
        name: dto.name.trim(),
        sku: dto.sku?.trim() || null,
        brand: dto.brand?.trim() || null,
        description: dto.description?.trim() || null,
        categoryId: dto.categoryId,
        price: dto.price.toFixed(2),
        stock: dto.stock,
        minThreshold: dto.minThreshold,
        status: this.normalizeStatus(dto.stock, dto.status),
      })
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: created.id,
      metadata: {
        name: created.name,
        stock: created.stock,
        minThreshold: created.minThreshold,
      },
    });

    return created;
  }

  async list(query: ListProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      query.categoryId ? eq(products.categoryId, query.categoryId) : undefined,
      query.status ? eq(products.status, query.status) : undefined,
      query.search
        ? or(
            like(
              sql`LOWER(${products.name})`,
              `%${query.search.toLowerCase()}%`,
            ),
            like(
              sql`LOWER(${categories.name})`,
              `%${query.search.toLowerCase()}%`,
            ),
          )
        : undefined,
    ].filter((condition) => condition !== undefined);

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        sku: products.sku,
        brand: products.brand,
        description: products.description,
        price: products.price,
        stock: products.stock,
        minThreshold: products.minThreshold,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(offset);

    const [countRow] = await this.db
      .select({ total: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause);

    return {
      data: rows,
      page,
      limit,
      total: countRow.total,
      totalPages: Math.max(1, Math.ceil(countRow.total / limit)),
    };
  }

  async getById(id: string) {
    const [product] = await this.db
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        sku: products.sku,
        brand: products.brand,
        description: products.description,
        price: products.price,
        stock: products.stock,
        minThreshold: products.minThreshold,
        status: products.status,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, actorUserId?: string) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId) {
      const [category] = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, dto.categoryId))
        .limit(1);

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const stock = dto.stock ?? existing.stock;
    if (stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const status = this.normalizeStatus(stock, dto.status ?? existing.status);

    const [updated] = await this.db
      .update(products)
      .set({
        name: dto.name?.trim() ?? existing.name,
        sku: dto.sku !== undefined ? dto.sku.trim() || null : existing.sku,
        brand:
          dto.brand !== undefined ? dto.brand.trim() || null : existing.brand,
        description:
          dto.description !== undefined
            ? dto.description.trim() || null
            : existing.description,
        categoryId: dto.categoryId ?? existing.categoryId,
        price: dto.price !== undefined ? dto.price.toFixed(2) : existing.price,
        stock,
        minThreshold: dto.minThreshold ?? existing.minThreshold,
        status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: updated.id,
      metadata: {
        name: updated.name,
        stock: updated.stock,
        status: updated.status,
      },
    });

    return updated;
  }

  async remove(id: string, actorUserId?: string) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const [orderUsage] = await this.db
      .select({ total: count() })
      .from(orderItems)
      .where(eq(orderItems.productId, id));

    if (orderUsage.total > 0) {
      throw new BadRequestException(
        'Cannot delete product that already exists in orders',
      );
    }

    await this.db.delete(products).where(eq(products.id, id));

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'PRODUCT_DELETED',
      entityType: 'product',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { id, deleted: true };
  }
}
