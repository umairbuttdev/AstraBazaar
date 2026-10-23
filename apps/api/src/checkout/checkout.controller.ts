import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  CheckoutService,
  type CheckoutShippingInput,
} from './checkout.service.js';

@Controller()
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('checkout')
  quote(@Req() request: AuthenticatedRequest) {
    return this.checkoutService.quote(request.user!);
  }

  @Get('checkout/addresses')
  listAddresses(@Req() request: AuthenticatedRequest) {
    return this.checkoutService.listAddresses(request.user!);
  }

  @Post('checkout')
  placeOrder(
    @Req() request: AuthenticatedRequest,
    @Body() body: CheckoutShippingInput,
  ) {
    return this.checkoutService.placeOrder(request.user!, body);
  }

  @Get('orders')
  listOrders(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: string,
  ) {
    return this.checkoutService.listOrders(request.user!, {
      page,
      limit,
      filter,
    });
  }

  @Get('orders/:id')
  getOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.checkoutService.getOrder(request.user!, id);
  }

  @Post('orders/:id/cancel')
  cancelOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.checkoutService.cancelOrder(request.user!, id);
  }

  @Delete('orders/:id')
  deleteOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.checkoutService.deleteOrder(request.user!, id);
  }
}
