import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.accessToken!);
  }

  @Post('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return {
      ok: true,
      user: request.user,
    };
  }
}
