import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ActivityService } from './activity.service';

class ActivityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getRecent(@Query() query: ActivityQueryDto) {
    return this.activityService.getRecent(query.limit ?? 10);
  }
}
