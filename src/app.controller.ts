import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

type AskQuestionDto = {
  question: string;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/askQuestion')
  askQuestion(@Body() askQuestionDto: AskQuestionDto) {
    return this.appService.askQuestion(askQuestionDto.question);
  }
}
