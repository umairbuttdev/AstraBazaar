import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, ProductStatus } from '@prisma/client';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  AdminService,
  type AdminCreateProductInput,
  type AdminUpdateProductInput,
} from './admin.service.js';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('products')
  listProducts() {
    return this.adminService.listProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Post('products')
  createProduct(@Body() body: AdminCreateProductInput) {
    return this.adminService.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() body: AdminUpdateProductInput,
  ) {
    return this.adminService.updateProduct(id, body);
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() body: { status?: ProductStatus },
  ) {
    return this.adminService.updateProduct(id, { status: body.status });
  }

  @Get('inventory')
  listInventory() {
    return this.adminService.listInventory();
  }

  @Patch('inventory/:variantId')
  updateInventory(
    @Param('variantId') variantId: string,
    @Body() body: { quantity?: number },
  ) {
    return this.adminService.updateInventory(variantId, body.quantity ?? -1);
  }

  @Get('orders')
  listOrders() {
    return this.adminService.listOrders();
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

  @Get('categories')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Get('brands')
  listBrands() {
    return this.adminService.listBrands();
  }
}
