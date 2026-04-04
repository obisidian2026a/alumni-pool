import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @Length(2, 150)
  customerName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
