/* eslint-disable prettier/prettier */
import { IsOptional } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  title: string;

  @Column('float', {
    default: 0,
  })
  price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column('text', {
    unique: true,
  })
  slug: string;

  @Column('numeric', {
    default: 0,
  })
  stock: number;

  @Column({
    type: 'text',
    array: true,
  })
  sizes: string[];

  @Column('text')
  gender: string;

  @OneToMany(
    () => ProductImage,
    (productImage) => productImage.product,
    { cascade: true, eager: true }, //Set eager in true to load all images when we call getBy endpoint by Using a FIND method
  )
  @IsOptional()
  images?: ProductImage[];

  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[];

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLocaleLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.title
      .toLocaleLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
  // @BeforeUpdate() other good option, but this one does not check if the title was modified
  // checkSlugUpdate() {
  //  this.slug = this.slug
  //  .toLocaleLowerCase()
  //  .replaceAll(' ', '_')
  //  .replaceAll("'", '');
  // }
}
