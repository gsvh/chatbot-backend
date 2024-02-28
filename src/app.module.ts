import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PDFChatBot } from './pdf-chatbot';
import { SimpleChatBot } from './simple-chatbot';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, SimpleChatBot, PDFChatBot],
})
export class AppModule {}
