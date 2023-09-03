/* eslint-disable prettier/prettier */
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class IsValidUuid implements PipeTransform {
  transform(value: string) {
    
    if (!isUUID(value)) {
        throw new BadRequestException(`${value} is not a valid UUID`)
    }

    return value;
  }
}