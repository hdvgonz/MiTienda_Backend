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
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    //usando patron repository
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      /*OPTO MEJOR POR CREAR UN PROCEDIMIENTO ANTES DE ALMACENAR EN EL PRODUCT.ENTITY (BeforeInsert) */
      const product = this.productsRepository.create(createProductDto); //Creating object instance
      return await this.productsRepository.save(product); //saving the object instance in the database
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return await this.productsRepository.find({
      take: limit,
      skip: offset,
      //TODO: relaciones
    });
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productsRepository.findOneBy({ id: term });
    }

    //Buscando por titulo
    if (!product) {
      const queryBuilder = this.productsRepository.createQueryBuilder();
      product = await queryBuilder
        .where(`lower(title) = :title or slug = :slug`, {
          title: term.toLocaleLowerCase(),
          slug: term.toLocaleLowerCase(),
        })
        .getOne(); //Buscamos ya sea por titulo o slug, como es probable que encuentre los dos, le pedimos que tragia uno con getOne()
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

  async update(id: string, updateProductDto: UpdateProductDto) {
    //Busca un producto por el ID y carga todas las propiedades que esten en el updateProductDto, preload lo prepara para la actualizacion
    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException(
        `Sorry, the product with id: ${id} was not found`,
      );
    }
    try {
      await this.productsRepository.save(product);

      return product;
    } catch (error) {
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

  private handleDBException(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.log(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
