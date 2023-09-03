/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator'

export class PaginationDto {
  
  @IsOptional({})
  @IsPositive()
  @Type( () => Number ) //Tranformamos a Number, pues viene en String
  limit?: number;

  @IsOptional({})
  @Type( () => Number)
  offset?: number;
}
