import { IsIn } from 'class-validator';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];
}
