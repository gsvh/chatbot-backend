import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import {
  ChatOpenAI,
  OpenAICallOptions,
  OpenAIEmbeddings,
} from '@langchain/openai';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { formatDocumentsAsString } from 'langchain/util/document';

export class PDFChatBot {
  model: ChatOpenAI<OpenAICallOptions>;
  chain: RunnableSequence<any, string>;

  constructor() {
    this.model = new ChatOpenAI({
      // temperature: 0.1, maxTokens: 2048
    });
  }
  async initialise() {
    console.log('initialising pdf chat bot...');

    const directoryLoader = new DirectoryLoader('src/pdf-chatbot/context', {
      '.pdf': (path) =>
        new PDFLoader(path, {
          splitPages: false,
        }),
      '.txt': (path) => new TextLoader(path),
    });

    const documents = await directoryLoader.load();
    const parsedDocuments = documents.map((document) => document.pageContent);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    const docs = await textSplitter.createDocuments(parsedDocuments);

    /* Create the vectorstore */
    const vectorStore = await HNSWLib.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
    );

    const retriever = vectorStore.asRetriever();

    const prompt = PromptTemplate.fromTemplate(`
        Jy is 'n vriendelike, hulpvaardige assistent. Jou doel om so goed moontlik te help.
        As jy onseker is oor 'n antwoord, dan kan jy sê: "Ek is onseker, kontak die Wolkskool span by navrae@wolkskool.co.za".
        Indien die stelling vir instruksies vra, gee soveel inligting as moontlik, in genommerde stappe.
        
        Reageer op die stelling met die volgende konteks:
        
        Konteks: {context}

        Stelling: {chat}
        
        Reageer slegs met die antwoord en in Afrikaans.
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
