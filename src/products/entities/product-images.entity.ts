/* eslint-disable prettier/prettier */
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '.';

@Entity()
export class ProductImage {

  @PrimaryGeneratedColumn({

  })
  id: string;

  @Column('text')
  url: string;

  @ManyToOne(
    () => Product,
    (product) => product.images,
    {onDelete: 'CASCADE'} //If a product is deleted off, also the images related too.
  )
  product: Product
}
