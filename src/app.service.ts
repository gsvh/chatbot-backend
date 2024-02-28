import { Injectable } from '@nestjs/common';
import { PDFChatBot } from './pdf-chatbot';

@Injectable()
export class AppService {
  constructor(private readonly chatBot: PDFChatBot) {
    this.chatBot.initialise();
  }

  async askQuestion(question: string) {
    const response = await this.chatBot.answerChat(question);
    return { data: response };
  }
}
