import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { ChatModule } from './chat/chat.module';
import { MulterModule } from '@nestjs/platform-express'; // Импортируем MulterModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Загружаем .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [User],
      synchronize: true, // В проде лучше использовать миграции
    }),
    AuthModule,
    UserModule,
    ChatModule,
    MulterModule.register({
      dest: './uploads', // Папка для сохранения загруженных файлов
      limits: { fileSize: 10 * 1024 * 1024 }, // Ограничение на размер файла (например, 10MB)
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
