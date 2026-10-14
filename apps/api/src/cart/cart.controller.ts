import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { CartService } from './cart.service.js';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.user!);
  }

  @Post('items')
  addItem(
    @Req() request: AuthenticatedRequest,
    @Body() body: { variantId?: string; quantity?: number },
  ) {
    return this.cartService.addItem(
      request.user!,
      body.variantId ?? '',
      body.quantity ?? 1,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body() body: { quantity?: number },
  ) {
    return this.cartService.updateItem(
      request.user!,
      itemId,
      body.quantity ?? 0,
    );
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(request.user!, itemId);
  }
}
