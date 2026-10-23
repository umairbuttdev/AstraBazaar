import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, ProductStatus } from '@prisma/client';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  AdminService,
  type AdminCreateProductInput,
  type AdminUpdateProductInput,
  type AdminVariantInput,
} from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard(@Query('range') range?: string) {
    return this.adminService.dashboard(range);
  }

  @Get('products')
  listProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listProducts({ page, limit, status, categoryId, brandId, q });
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Post('products')
  createProduct(@Body() body: AdminCreateProductInput) {
    return this.adminService.createProduct(body);
  }

  @Post('products/:id/variants')
  addVariant(@Param('id') id: string, @Body() body: AdminVariantInput) {
    return this.adminService.addVariant(id, body);
  }

  @Post('products/:id/expand-options')
  expandPackedOptions(@Param('id') id: string) {
    return this.adminService.expandPackedOptions(id);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() body: AdminUpdateProductInput,
  ) {
    return this.adminService.updateProduct(id, body);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Patch('products/:id/variants/:variantId')
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() body: AdminVariantInput & { isDefault?: boolean },
  ) {
    return this.adminService.updateVariant(id, variantId, body);
  }

  @Delete('products/:id/variants/:variantId')
  deleteVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.adminService.deleteVariant(id, variantId);
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() body: { status?: ProductStatus },
  ) {
    return this.adminService.updateProduct(id, { status: body.status });
  }

  @Get('inventory')
  listInventory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('stock') stock?: string,
  ) {
    return this.adminService.listInventory({ page, limit, q, stock });
  }

  @Patch('inventory/:variantId')
  updateInventory(
    @Param('variantId') variantId: string,
    @Body() body: { quantity?: number },
  ) {
    return this.adminService.updateInventory(variantId, body.quantity ?? -1);
  }

  @Get('orders')
  listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listOrders({ page, limit, status, paymentStatus, q });
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status?: OrderStatus },
  ) {
    return this.adminService.updateOrderStatus(
      id,
      body.status as OrderStatus,
    );
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id);
  }

  @Get('customers')
  listCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listCustomers({ page, limit, q });
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomer(id);
  }

  @Get('categories')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories')
  createCategory(
    @Body() body: { name?: string; description?: string | null; parentId?: string | null },
  ) {
    return this.adminService.createCategory(body);
  }

  @Get('brands')
  listBrands() {
    return this.adminService.listBrands();
  }

  @Post('brands')
  createBrand(@Body() body: { name?: string; description?: string | null }) {
    return this.adminService.createBrand(body);
  }
}
