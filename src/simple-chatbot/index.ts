import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  ChatOpenAI,
  OpenAICallOptions,
  OpenAIEmbeddings,
} from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { formatDocumentsAsString } from 'langchain/util/document';

import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { TextLoader } from 'langchain/document_loaders/fs/text';

export class SimpleChatBot {
  model: ChatOpenAI<OpenAICallOptions>;
  chain: RunnableSequence<any, string>;

  constructor() {
    this.model = new ChatOpenAI({
      // temperature: 0.1, maxTokens: 2048
    });
  }
  async initialise() {
    console.log('initialising...');
    const loader = new TextLoader('src/chatbot/data.txt');
    /* Load in the file we want to do question answering over */
    const document = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    const docs = await textSplitter.createDocuments([document[0].pageContent]);

    /* Create the vectorstore */
    const vectorStore = await HNSWLib.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
    );

    const retriever = vectorStore.asRetriever();

    const prompt = PromptTemplate.fromTemplate(`
        Reageer op die stelling met die volgende konteks:
        
        Konteks: {context}

        Stelling: {chat}
        
        Reageer slegs met die antwoord.
        `);

    this.chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        chat: new RunnablePassthrough(),
      },
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    console.log('Initialised');
  }

  async answerChat(chat: string) {
    console.log('1️⃣', chat);
    try {
      const response = await this.chain.invoke(chat + '\n');
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      return 'Iets het verkeerd geloop';
    }
  }
}
