import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(2, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  brand?: string;

  @IsOptional()
  @IsString()
  @Length(0, 600)
  description?: string;

  @IsUUID()
  categoryId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minThreshold!: number;

  @IsOptional()
  @IsString()
  status?: 'active' | 'out_of_stock';
}
