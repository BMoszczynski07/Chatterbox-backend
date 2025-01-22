import {
  BadRequestException,
  ForbiddenException,
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
import { UserDto } from 'src/classes/UserDto';
import { FindUserDto } from 'src/classes/FindUserDto';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  handleCheckLogin(unique_id: string): boolean {
    const uniqueId = unique_id;

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (!alphanumericRegex.test(uniqueId)) {
      return false;
    }

    return true;
  }

  async registerUser(user: UserDto) {
    if (
      !user.unique_id ||
      !user.firstName ||
      !user.lastName ||
      !user.email ||
      !user.password
    ) {
      throw new BadRequestException('All fields are required');
    }

    const passRequirements = {
      enoughLetters: user.password.length >= 8,
      hasUppercase: user.password !== user.password.toLowerCase(),
      hasLowercase: user.password !== user.password.toUpperCase(),
      specialCharacter: /[!@#\$%\^\&*\)\(+=._-]/.test(user.password),
    };

    if (
      !passRequirements.enoughLetters ||
      !passRequirements.hasLowercase ||
      !passRequirements.hasUppercase ||
      !passRequirements.specialCharacter
    ) {
      throw new BadRequestException('Password requirements not met');
    }

    if (!user.email.includes('@') || !user.email.includes('.')) {
      throw new BadRequestException('Invalid email');
    }

    if (!this.handleCheckLogin(user.unique_id)) {
      throw new BadRequestException(
        'Invalid login (only alphanumeric characters)',
      );
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const verify_code = v4();

    const newUser = await this.prisma.users.create({
      data: {
        unique_id: user.unique_id.toLowerCase(),
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        pass: hashedPassword,
        user_desc: '',
        create_date: new Date(),
        verified: false,
        profile_pic: `${process.env.BACKEND_URL}/static/${user.firstName.charAt(0).toLowerCase()}.png`,
        is_active: false,
        socket_id: '',
        verify_code,
      },
    });

    if (!newUser) {
      throw new InternalServerErrorException('Failed to create user');
    }

    this.mailerService.sendMail({
      to: user.email,
      from: process.env.SMTP_USER,
      subject: 'Verify your account',
      html: `<h1 style="color: #1996ac">Chatterbox</h1>
      
      <p>Please verify your account by clicking the link below</p>
      
      <a href="${process.env.BACKEND_URL}/api/v1.0.0/user/account/verify/${verify_code}">Verify your account</a>
      `,
    });

    return {
      message:
        'Account created successfully. Click a link sent to your email address in order to verify yout account.',
    };
  }

  async verifyAccount(verifyCode: string) {
    const updateUser = await this.prisma.users.updateMany({
      where: {
        verify_code: verifyCode,
      },
      data: {
        verified: true,
      },
    });

    if (!updateUser) {
      throw new InternalServerErrorException('Internal server error');
    }

    if (updateUser.count === 0) {
      throw new NotFoundException(
        'No user found with the provided verification code',
      );
    }

    return {
      message: 'Account verified successfully',
    };
  }

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

    if (findUser.verified === false) {
      throw new ForbiddenException(
        'You need to verify your email address in order to sign in',
      );
    }

    const token = this.generateJwtToken(findUser);

    const EXPIRES_IN = 20000;

    setTimeout(() => {
      this.unsetActive({
        unique_id: findUser.unique_id,
      });
    }, EXPIRES_IN);

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
      data: { socket_id: socketId, is_active: true },
    });

    return {
      message: 'Socket id updated successfully',
    };
  }

  async activeUsers(userId: string) {
    const parsedUserId = parseInt(userId);

    const activeUsersInSameConversation = await this.prisma.users.findMany({
      where: {
        is_active: true,
        id: { not: parsedUserId },
        ConversationParticipants: {
          some: {
            conversationparticipants_conversation: {
              ConversationParticipants: {
                some: {
                  user_id: parsedUserId, // Sprawdzamy, czy są w tej samej konwersacji co userId
                },
              },
            },
          },
        },
      },
    });

    return activeUsersInSameConversation;
  }

  async unsetActive(decodedToken: { unique_id: string }) {
    const updateUser = await this.prisma.users.update({
      where: { unique_id: decodedToken.unique_id },
      data: { is_active: false },
    });

    if (!updateUser) {
      throw new InternalServerErrorException('Error updating user');
    }

    return {
      message: 'Users active status set to false',
    };
  }

  async deleteUser(decodedToken: { unique_id: string }) {
    const deleteUser = await this.prisma.users.delete({
      where: { unique_id: decodedToken.unique_id },
    });

    if (!deleteUser) {
      throw new InternalServerErrorException('Error deleting account');
    }

    return {
      message: 'Account deleted successfully',
    };
  }

  async getFriends(userPayload: any) {
    const activeFriends = await this.prisma.users.findMany({
      where: {
        is_active: true,
        id: { not: userPayload.id },
        ConversationParticipants: {
          some: {
            conversationparticipants_conversation: {
              ConversationParticipants: {
                some: {
                  user_id: userPayload.id,
                },
              },
            },
          },
        },
      },
    });

    return activeFriends;
  }

  async findUser(findUserDto: FindUserDto) {
    const findUser: Users[] = await this.prisma
      .$queryRaw`select * from users where unique_id=${findUserDto.unique_id} or email=${findUserDto.email}`;

    if (findUser.length === 0) {
      throw new NotFoundException('User not found in our database');
    }

    return findUser[0];
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
