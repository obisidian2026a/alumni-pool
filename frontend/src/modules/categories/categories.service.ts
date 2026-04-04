import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, count, eq, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { categories, products } from '../../database/schema';
import { ActivityService } from '../activity/activity.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleDB,
    private readonly activityService: ActivityService,
  ) {}

  async list(search?: string) {
    const term = search?.trim();

    if (!term) {
      return this.db.select().from(categories).orderBy(asc(categories.name));
    }

    return this.db
      .select()
      .from(categories)
      .where(sql`LOWER(${categories.name}) LIKE ${`%${term.toLowerCase()}%`}`)
      .orderBy(asc(categories.name));
  }

  async create(dto: CreateCategoryDto, actorUserId?: string) {
    const name = dto.name.trim();
    const description = dto.description?.trim() || null;

    const [existing] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    if (existing) {
      throw new ConflictException('Category name already exists');
    }

    const [created] = await this.db
      .insert(categories)
      .values({ name, description })
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'CATEGORY_CREATED',
      entityType: 'category',
      entityId: created.id,
      metadata: { name: created.name, description: created.description },
    });

    return created;
  }

  async update(id: string, dto: UpdateCategoryDto, actorUserId?: string) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const name = dto.name?.trim();
    const description = dto.description?.trim();
    if (name && name !== existing.name) {
      const [duplicate] = await this.db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);

      if (duplicate) {
        throw new ConflictException('Category name already exists');
      }
    }

    const [updated] = await this.db
      .update(categories)
      .set({
        name: name ?? existing.name,
        description:
          description !== undefined
            ? description || null
            : existing.description,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'CATEGORY_UPDATED',
      entityType: 'category',
      entityId: updated.id,
      metadata: { name: updated.name, description: updated.description },
    });

    return updated;
  }

  async remove(id: string, actorUserId?: string) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const [dependentProducts] = await this.db
      .select({ total: count() })
      .from(products)
      .where(eq(products.categoryId, id));

    if (dependentProducts.total > 0) {
      throw new BadRequestException(
        'Cannot delete category while products still use it',
      );
    }

    const [removed] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    await this.activityService.logAction({
      userId: actorUserId,
      action: 'CATEGORY_DELETED',
      entityType: 'category',
      entityId: id,
      metadata: { name: removed.name },
    });

    return { id, deleted: true };
  }
}
