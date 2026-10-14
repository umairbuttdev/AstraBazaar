import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SupabaseService } from './supabase.service.js';

@Module({
  controllers: [AuthController],
  providers: [SupabaseService, AuthService, AuthGuard],
  exports: [SupabaseService, AuthGuard],
})
export class AuthModule {}
