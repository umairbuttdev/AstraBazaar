import { Controller, Get, Param, Query } from '@nestjs/common';
import { parseListProductsQuery } from './list-products.query.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.productsService.findAll(parseListProductsQuery(query));
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
