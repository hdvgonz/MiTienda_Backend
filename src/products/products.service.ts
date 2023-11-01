/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    //usando patron repository
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository:Repository<ProductImage>,

    private readonly dataSource: DataSource //at the moment it is injected, it knows the database flow, database user, etc
  ) {}

  async create(createProductDto: CreateProductDto) {

    const {images = [], ...productDetails} = createProductDto

    try {
      /*OPTO MEJOR POR CREAR UN PROCEDIMIENTO ANTES DE ALMACENAR EN EL PRODUCT.ENTITY (BeforeInsert) */
      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({url:image}))
        
      }); //Creating object instance
      await this.productsRepository.save(product);

     
      return {...product, images}; //Im returning the object as i want to show it in the frontend, because i dont want to show some images details, such as id but only url.
      
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products =  await this.productsRepository.find({
      take: limit,
      skip: offset,
     relations:{
      images:true,
     }
    });
    /**Getting relations images = true i meaning that i want to get the images as well and include them in the response, every single product has an array of images attached, so when i fire my petition, in the response i¿ll get an array of images too */

    return products.map ( product => ({
      ...product,
      images: product.images.map( image => image.url),
    }))
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productsRepository.findOneBy({ id: term });
    }

    //Buscando por titulo o slug
    if (!product) {
      const queryBuilder = this.productsRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where(`lower(title) = :title or slug = :slug`, {
          title: term.toLocaleLowerCase(),
          slug: term.toLocaleLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne(); 
        //prod.images es el lugar donde queremos hacer el leftJoin
        //Buscamos ya sea por titulo o slug, como es probable que encuentre los dos, le pedimos que traiga uno con getOne()
    }
    // if (!product) {
    //   product = await this.productsRepository.findOneBy({
    //     slug: term,
    //   });
    // }
    if (!product) {
      throw new NotFoundException(
        `the product with id or slug "${term}" was not found`,
      );
    }

    return product;
  }

  async findOnePlain(term: string) {

    const {images = [], ...rest} = await this.findOne(term);

    return {
      ...rest,
      images: images.map( img => img.url),
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const {images, ...dataToUpdate} = updateProductDto; 
    
    //Busca un producto por el ID y carga todas las propiedades que esten en el updateProductDto, preload lo prepara para la actualizacion
    const product = await this.productsRepository.preload({
      id,
      ...dataToUpdate
    });
    
    if (!product) {
      throw new NotFoundException(
        `Sorry, the product with id: ${id} was not found`,
      );
    }

    //Create query Runner
    //QueryRunner Doesn't impact db untill we commit it.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction()

    try {

      //If any images is coming up, it means i want to delete other existing images in the Database
      if (  images ) {
      /**I want to delete from Productimage table every register where the property product match other object property named id (named in entities), the second arg is the delete condition. id must be equal to id i'm inserting in async update(id: string, updateProductDto: UpdateProductDto)*/

        await queryRunner.manager.delete( ProductImage, {product: { id }} )

        /**Creating new images instances */
        product.images = images.map( img => this.productImageRepository.create({url: img}))
      } 
      await queryRunner.manager.save( product )

      // await this.productsRepository.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      
      return this.findOnePlain( id )
    } catch (error) {
      
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBException(error);
    }
  }

  async remove(term: string) {
    const { affected } = await this.productsRepository.delete({ id: term });

    if (affected === 0) {
      throw new BadRequestException(`Product with id "${term} not Found`);
    }

    return {
      deleted: true,
    };
  }

  async deleteAllProduct(){
    const query = this.productsRepository.createQueryBuilder('product')

    try {
      return await query
        .delete()
        .where({})
        .execute()

    } catch (error) {
      this.handleDBException(error);
    }
  }

  private handleDBException(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.log(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
