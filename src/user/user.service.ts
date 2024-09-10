import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Users } from '@prisma/client';
import UserLoginDTO from 'src/classes/UserLoginDTO';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(decodedToken: { unique_id: string }): Promise<Users> {
    const findUser = await this.prisma.users.findFirst({
      where: { unique_id: decodedToken.unique_id },
    });

    if (!findUser) {
      throw new NotFoundException('User not found in our database');
    }

    return findUser;
  }

  async login({
    login,
    password,
  }: UserLoginDTO): Promise<{ user: Users; token: string }> {
    if (!login || !password) {
      throw new BadRequestException('All fields are required');
    }

    const findUser = await this.prisma.users.findFirst({
      where: { unique_id: login },
    });

    if (!findUser) {
      throw new NotFoundException('User not found in our database');
    }

    const isPasswordCorrect = await this.validateUserPassword(
      findUser.pass,
      password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid password or login');
    }

    const token = this.generateJwtToken(findUser);

    return { user: findUser, token };
  }

  private generateJwtToken(user: Users): string {
    const payload = { unique_id: user.unique_id };
    const secret = process.env.JWT_SECRET_KEY;

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  async validateUserPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
