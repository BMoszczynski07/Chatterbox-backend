import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfilePicService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfilePicture(
    decodedToken: { unique_id: string },
    fileName: string,
  ) {
    const findUser = await this.prisma.users.findFirst({
      where: {
        unique_id: decodedToken.unique_id,
      },
    });

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.users.update({
      where: {
        unique_id: decodedToken.unique_id,
      },
      data: {
        profile_pic: `${process.env.BACKEND_URL}/static/${fileName}`,
      },
    });

    return {
      message: 'Profile picture has been updated',
    };
  }
}
