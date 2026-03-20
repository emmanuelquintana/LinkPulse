import { Module } from '@nestjs/common';
import { SupabaseJwtService } from './supabase-jwt.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [SupabaseJwtService],
  controllers: [AuthController],
  exports: [SupabaseJwtService],
})
export class AuthModule {}
