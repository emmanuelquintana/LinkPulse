import { Controller, Get, Post, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'Login user via Supabase and return session tokens' })
  async login(@Body() loginDto: LoginDto) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new HttpException(
        'Supabase is not configured on the server',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginDto.email,
          password: loginDto.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(
          {
            code: 'invalid_credentials',
            message: data.error_description || data.message || 'Invalid login credentials',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 'invalid_credentials',
          message: error instanceof Error ? error.message : 'Invalid login credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Get current user session' })
  getMe(@Req() req: Request & { user?: unknown }) {
    return {
      ok: true,
      user: req.user,
    };
  }
}

