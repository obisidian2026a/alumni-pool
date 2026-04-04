import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { activityLogs } from '../../database/schema';

interface LogActionInput {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(@Inject('DRIZZLE') private readonly db: DrizzleDB) {}

  async logAction(input: LogActionInput): Promise<void> {
    await this.db.insert(activityLogs).values({
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  async getRecent(limit = 10) {
    const safeLimit = Math.max(1, Math.min(limit, 20));

    return this.db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(safeLimit);
  }
}
