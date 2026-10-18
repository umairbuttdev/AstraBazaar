import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';
import { AuthGuard } from './auth.guard.js';
import { SupabaseService } from './supabase.service.js';

@Global()
@Module({
  providers: [SupabaseService, AuthGuard, AdminGuard],
  exports: [SupabaseService, AuthGuard, AdminGuard],
})
export class AuthModule {}

