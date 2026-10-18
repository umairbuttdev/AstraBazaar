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
import {
  CheckoutService,
  type CheckoutShippingInput,
} from './checkout.service.js';

@Controller()
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout')
  placeOrder(
    @Req() request: AuthenticatedRequest,
    @Body() body: CheckoutShippingInput,
  ) {
    return this.checkoutService.placeOrder(request.user!, body);
  }

  @Get('orders')
  listOrders(@Req() request: AuthenticatedRequest) {
    return this.checkoutService.listOrders(request.user!);
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
