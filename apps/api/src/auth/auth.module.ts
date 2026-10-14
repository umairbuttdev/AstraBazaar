import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { SupabaseService } from './supabase.service.js';

@Global()
@Module({
  providers: [SupabaseService, AuthGuard],
  exports: [SupabaseService, AuthGuard],
})
export class AuthModule {}
