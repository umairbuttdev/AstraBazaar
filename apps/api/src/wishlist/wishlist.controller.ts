import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { WishlistService } from './wishlist.service.js';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() request: AuthenticatedRequest) {
    return this.wishlistService.getWishlist(request.user!);
  }

  @Post('items')
  addItem(
    @Req() request: AuthenticatedRequest,
    @Body() body: { productId?: string },
  ) {
    return this.wishlistService.addItem(request.user!, body.productId ?? '');
  }

  @Delete('products/:productId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeItem(request.user!, productId);
  }
}
