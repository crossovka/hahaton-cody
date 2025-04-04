import { MulterModule } from '@nestjs/platform-express';
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Папка для сохранения файлов
      limits: { fileSize: 10 * 1024 * 1024 }, // Ограничение на 10MB
    }),
  ],
  controllers: [ChatController],
})
export class ChatModule {}
