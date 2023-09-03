/* eslint-disable prettier/prettier */
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column('text',{
      unique: true
  })
  slug: string;

  @Column('numeric',{
    default: 0
  })
  stock: number;

  @Column({
      type: 'text',
      array: true,
  })
  sizes: string[];

  @Column('text')
  gender: string;

  //TODO: tags, image
  @Column('text',{
    array:true,
    default: []
  })
  tags: string[];

  @BeforeInsert()
  checkSlugInsert() {
    
    if (!this.slug){
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
