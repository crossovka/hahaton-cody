import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatController {
  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file')) // Убедитесь, что 'file' — это ключ, который ожидает сервер
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Логика обработки файла
    console.log('Получен файл:', file);

    return {
      message: 'Файл успешно загружен!',
      file: file.originalname,
    };
  }
}
