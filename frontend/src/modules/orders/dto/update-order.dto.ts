import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { OrderItemInputDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  customerName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];
}
