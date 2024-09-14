import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

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

    const fileNameFromURL = path.basename(findUser.profile_pic);

    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'static',
      fileNameFromURL,
    );

    console.log(fileNameFromURL, filePath);

    if (fs.existsSync(filePath)) {
      try {
        // Usunięcie pliku
        if (fileNameFromURL.startsWith(findUser.unique_id)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        throw new InternalServerErrorException(
          "Couldn't set new profile picture",
        );
      }
    } else {
      throw new InternalServerErrorException(
        "Couldn't set new profile picture",
      );
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
