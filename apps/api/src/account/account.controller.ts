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
import { AccountService } from './account.service.js';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  summary(@Req() request: AuthenticatedRequest) {
    return this.accountService.summary(request.user!);
  }

  @Get('profile')
  profile(@Req() request: AuthenticatedRequest) {
    return this.accountService.getProfile(request.user!);
  }

  @Patch('profile')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: { fullName?: unknown },
  ) {
    return this.accountService.updateProfile(request.user!, body ?? {});
  }

  @Get('addresses')
  listAddresses(@Req() request: AuthenticatedRequest) {
    return this.accountService.listAddresses(request.user!);
  }

  @Post('addresses')
  createAddress(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.accountService.createAddress(request.user!, body ?? {});
  }

  @Get('addresses/:id')
  getAddress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.accountService.getAddress(request.user!, id);
  }

  @Patch('addresses/:id')
  updateAddress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.accountService.updateAddress(request.user!, id, body ?? {});
  }

  @Post('addresses/:id/default')
  setDefault(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.accountService.setDefaultAddress(request.user!, id);
  }

  @Delete('addresses/:id')
  deleteAddress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.accountService.deleteAddress(request.user!, id);
  }
}
