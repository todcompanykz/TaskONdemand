import { Controller, Post, Body, Logger, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    this.logger.log(`Register attempt: email=${registerDto.email}, origin=${req.headers.origin || 'no-origin'}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`Register success: email=${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Register failed: email=${registerDto.email}, error=${error.message}`);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    this.logger.log(`Login attempt: email=${loginDto.email}, origin=${req.headers.origin || 'no-origin'}`);
    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`Login success: email=${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Login failed: email=${loginDto.email}, error=${error.message}`);
      throw error;
    }
  }
}
