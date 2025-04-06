import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('chat')
export class ChatController {
  constructor(private readonly pdfOcrService: PdfOcrService) {}

  @Post('upload-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads', // Папка, куда сохраняем файлы
        filename: (req, file, cb) => {
          cb(null, Date.now() + path.extname(file.originalname)); // Генерируем уникальное имя файла
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      console.warn('❌ Upload failed: No file');
      throw new BadRequestException('No file uploaded');
    }

    console.log('🎉 File received');
    console.log('📄 Filename:', file.originalname);
    console.log('📦 Filesize:', file.size);

    if (!file.path) {
      throw new BadRequestException('No file uploaded or file path is empty');
    }

    try {
      const text = await this.pdfOcrService.parsePdf(
        fs.readFileSync(file.path), // Чтение файла с диска
        file.originalname,
      );
      console.log('✅ Text successfully recognized');

      // Удаляем файл после обработки
      await fs.unlink(file.path);
      console.log(`✅ File deleted: ${file.path}`);

      return {
        message: 'File successfully uploaded and processed!',
        file: text,
      };
    } catch (err) {
      console.error('🔥 Error recognizing PDF:', err);
      throw new BadRequestException('Error recognizing text');
    }
  }
}
