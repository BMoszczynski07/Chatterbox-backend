import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Users } from '@prisma/client';
import UserLoginDTO from 'src/classes/UserLoginDTO';
import { UserService } from './user.service';
import { UpdatedUserDTO } from 'src/classes/UpdatedUserDTO';
import { ChangePassDTO } from 'src/classes/ChangePassDTO';

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
}
