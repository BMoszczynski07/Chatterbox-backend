import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Users } from '@prisma/client';
import UserLoginDTO from './classes/UserLoginDTO';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async login(user: UserLoginDTO): Promise<Users> {
    const { login, password } = user;

    if (!login || !password) {
      throw new BadRequestException('All fields are required');
    }

    const findUser = await this.prisma.users.findFirst({
      where: { unique_id: login },
    });

    if (!findUser) {
      throw new BadRequestException('User not found');
    }

    const isPasswordCorrect = await this.validateUserPassword(
      findUser.pass,
      password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid password or login');
    }

    return findUser;
  }

  async validateUserPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
