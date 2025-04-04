import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { MulterModule } from '@nestjs/platform-express'; // Импортируем MulterModule

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Устанавливаем глобальный префикс для API
  app.setGlobalPrefix('api');

  // Настройка CORS для работы с клиентом
  app.use(
    cors({
      origin: 'http://localhost:3001', // Укажите ваш клиентский URL
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // Запуск сервера
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
