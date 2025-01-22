import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import UserLoginDTO from 'src/classes/UserLoginDTO';
import { UserService } from './user.service';
import { UpdatedUserDTO } from 'src/classes/UpdatedUserDTO';
import { ChangePassDTO } from 'src/classes/ChangePassDTO';
import { Users } from '@prisma/client';
import { UserDto } from 'src/classes/UserDto';
import { FindUserDto } from 'src/classes/FindUserDto';
import { Response } from 'express';
import { join } from 'path';
import { promises as fs } from 'fs';

@Controller('/api/v1.0.0/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() userLoginDto: UserLoginDTO,
  ): Promise<{ user: Users; token: string }> {
    try {
      return await this.userService.login(userLoginDto);
    } catch (err) {
      throw err;
    }
  }

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() user: UserDto) {
    try {
      return await this.userService.registerUser(user);
    } catch (err) {
      throw err;
    }
  }

  @Get('/account/verify/:verify_code')
  @Render('verify')
  async accountVerify(
    @Param('verify_code') verifyCode: string,
    @Res() res: Response,
  ) {
    try {
      await this.userService.verifyAccount(verifyCode);

      return {
        info: 'Account verified successfully',
        link: `${process.env.CORS_ORIGIN}/login`,
      };
    } catch (err) {
      return { info: err.message, link: `${process.env.CORS_ORIGIN}/login` };
    }
  }

  @Get('/get')
  @HttpCode(HttpStatus.OK)
  async getUser(@Req() req: Request): Promise<Users> {
    try {
      const decodedToken = req['user'];

      return await this.userService.getUser(decodedToken);
    } catch (err) {
      throw err;
    }
  }

  @Get('/get-unprotected/:unique_id')
  @HttpCode(HttpStatus.OK)
  async unprotectedGetUser(
    @Param('unique_id') unique_id: string,
  ): Promise<Users> {
    return await this.userService.unprotectedGetUser(unique_id);
  }

  @Patch('/update')
  @HttpCode(HttpStatus.OK)
  async updateUser(@Req() req: Request, @Body() updatedUser: UpdatedUserDTO) {
    try {
      const decodedToken = req['user'];

      return await this.userService.updateUser(updatedUser, decodedToken);
    } catch (err: any) {
      throw err;
    }
  }

  @Patch('/change-pass')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() changePass: ChangePassDTO) {
    try {
      const decodedToken = req['user'];

      return await this.userService.changePassword(changePass, decodedToken);
    } catch (err: any) {
      throw err;
    }
  }

  @Get('/test/hash-password/:password')
  @HttpCode(HttpStatus.OK)
  hashPassword(@Param('password') password: string) {
    try {
      return this.userService.hashPassword(password);
    } catch (err: any) {
      throw err;
    }
  }

  @Patch('/update-socket-id/:socketId')
  @HttpCode(HttpStatus.OK)
  updateSocketId(
    @Req() req: Request,
    @Param('socketId') socketId: string,
  ): Promise<{ message: string }> {
    try {
      const decodedToken = req['user'];

      return this.userService.updateSocketId(socketId, decodedToken);
    } catch (err: any) {
      throw err;
    }
  }

  @Get('/active-users/:userId')
  activeUsers(@Param('userId') userId: string) {
    try {
      return this.userService.activeUsers(userId);
    } catch (err) {
      throw err;
    }
  }

  @Patch('/unset-active')
  unsetActive(@Req() req: Request) {
    try {
      const decodedToken = req['user'];

      return this.userService.unsetActive(decodedToken);
    } catch (err) {
      throw err;
    }
  }

  @Delete('/delete')
  deleteUser(@Req() req: Request) {
    try {
      const decodedToken = req['user'];

      return this.userService.deleteUser(decodedToken);
    } catch (err) {
      throw err;
    }
  }

  @Post('/find')
  @HttpCode(HttpStatus.OK)
  async findUser(@Body() findUserDto: FindUserDto) {
    try {
      return await this.userService.findUser(findUserDto);
    } catch (err) {
      throw err;
    }
  }
}
