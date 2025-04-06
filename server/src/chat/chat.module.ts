import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ChatController } from './chat.controller';
import { PdfOcrService } from './services/pdf-ocr.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Папка для временного хранения
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB лимит
    }),
  ],
  controllers: [ChatController],
  providers: [PdfOcrService],
})
export class ChatModule {}
