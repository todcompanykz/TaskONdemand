import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: User }> {
    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'auth.service.ts:22',message:'Register entry',data:{email:registerDto.email,hasFirstName:!!registerDto.firstName,hasLastName:!!registerDto.lastName,hasPassword:!!registerDto.password,hasConfirmPassword:!!registerDto.confirmPassword},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    // Validate password match
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
      phoneNumber: registerDto.phoneNumber || null,
      ratingAvg: 0,
      ratingCount: 0,
    });

    await this.usersRepository.save(user);

    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'auth.service.ts:48',message:'Register user saved',data:{userId:user.id,userFirstName:user.firstName,userLastName:user.lastName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
