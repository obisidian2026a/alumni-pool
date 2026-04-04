import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export class ListOrdersDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
