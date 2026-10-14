import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.findAll({ category, brand, status });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
