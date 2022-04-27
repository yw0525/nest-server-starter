import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { PostsEntity } from './posts/entity/posts.entity';

import env from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [env.path],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (service: ConfigService) => {
        return {
          type: 'mysql',
          entities: [PostsEntity],
          host: service.get('DB_HOST'),
          port: service.get<number>('DB_PORT'),
          username: service.get('DB_USER'),
          password: service.get('DB_PASSWORD'),
          database: service.get('DB_DATABASE'),
          timezone: '+08:00',
          synchronize: true,
        };
      },
    }),
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
