import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import UserLoginDTO from 'src/classes/UserLoginDTO';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Users } from '@prisma/client';
import { UpdatedUserDTO } from 'src/classes/UpdatedUserDTO';
import { ChangePassDTO } from 'src/classes/ChangePassDTO';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUser(
    updatedUser: UpdatedUserDTO,
    decodedToken: { unique_id: string },
  ) {
    if (updatedUser.unique_id !== updatedUser.unique_id.toLowerCase()) {
      throw new BadRequestException('Invalid login');
    }

    if (updatedUser.unique_id.length < 4 || updatedUser.unique_id.length > 30) {
      throw new BadRequestException('Invalid length of login');
    }

    if (
      updatedUser.first_name.length < 2 ||
      updatedUser.first_name.length > 20
    ) {
      throw new BadRequestException('Invalid length of first name');
    }

    if (updatedUser.last_name.length < 2 || updatedUser.last_name.length > 50) {
      throw new BadRequestException('Invalid length of last name');
    }

    if (updatedUser.user_desc.length > 300) {
      throw new BadRequestException('Invalid length of description');
    }

    const userUpdate = await this.prisma.users.update({
      where: {
        unique_id: decodedToken.unique_id,
      },
      data: updatedUser,
    });

    if (!userUpdate) {
      throw new NotFoundException('User not found in our database');
    }

    return {
      message: 'User information updated successfully',
    };
  }

  async unprotectedGetUser(unique_id: string): Promise<Users> {
    const findUser = await this.prisma.users.findFirst({
      where: { unique_id },
    });

    if (!findUser) {
      throw new NotFoundException('User not found in our database');
    }

    return findUser;
  }

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

  async changePassword(
    changePass: ChangePassDTO,
    decodedToken: { unique_id: string },
  ) {
    if (
      !changePass.confirm_new_pass ||
      !changePass.cur_pass ||
      !changePass.new_pass
    ) {
      throw new BadRequestException('All fields are required');
    }

    if (changePass.cur_pass === changePass.new_pass) {
      throw new BadRequestException(
        'The new password cannot be the same as the current password',
      );
    }

    if (changePass.new_pass !== changePass.confirm_new_pass) {
      throw new BadRequestException(
        'The new password and confirmation do not match',
      );
    }

    if (!this.containsSpecialChar(changePass.new_pass)) {
      throw new BadRequestException(
        'The new password must contain a special character',
      );
    }

    if (changePass.new_pass.length < 8) {
      throw new BadRequestException(
        'The new password must be at least 8 characters long.',
      );
    }

    if (
      changePass.new_pass === changePass.new_pass.toLowerCase() ||
      changePass.new_pass === changePass.new_pass.toUpperCase()
    ) {
      throw new BadRequestException(
        'The new password must contain one big letter and one small letter.',
      );
    }

    const findUser = await this.prisma.users.findFirst({
      where: { unique_id: decodedToken.unique_id },
    });

    if (!findUser) {
      throw new NotFoundException('User not found in our database');
    }

    const isPasswordCorrect = await this.validateUserPassword(
      findUser.pass,
      changePass.cur_pass,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid password');
    }

    const hashedNewPassword = await bcrypt.hash(changePass.new_pass, 10);

    await this.prisma.users.update({
      where: { unique_id: decodedToken.unique_id },
      data: { pass: hashedNewPassword },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async updateSocketId(socketId: string, decodedToken: { unique_id: string }) {
    await this.prisma.users.update({
      where: { unique_id: decodedToken.unique_id },
      data: { socket_id: socketId },
    });

    return {
      message: 'Socket id updated successfully',
    };
  }

  hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  containsSpecialChar(str: string): boolean {
    const specialCharsRegex = /[!@#\$%\^\&*\)\(+=._-]/;
    return specialCharsRegex.test(str);
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
