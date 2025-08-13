import { PrismaClient } from '@prisma/client';
import { ConfigLoader, Config } from '../../config/loader';
import { CompositeObservabilityProvider } from '../../infrastructure/observability/CompositeObservabilityProvider';
import { LangSmithObservabilityProvider } from '../../infrastructure/observability/LangSmithObservabilityProvider';
import { OpenLLMetryObservabilityProvider } from '../../infrastructure/observability/OpenLLMetryObservabilityProvider';
import { VoiceNoteRepositoryImpl } from '../../infrastructure/persistence/VoiceNoteRepositoryImpl';
import { UserRepositoryImpl } from '../../infrastructure/persistence/UserRepositoryImpl';
import { EventStoreImpl } from '../../infrastructure/persistence/EventStoreImpl';
import { WhisperAdapter } from '../../infrastructure/adapters/WhisperAdapter';
import { LLMAdapter } from '../../infrastructure/adapters/LLMAdapter';
import { LocalStorageAdapter } from '../../infrastructure/adapters/LocalStorageAdapter';
import { DatabaseClient } from '../../infrastructure/database/DatabaseClient';
import { ProcessingOrchestrator } from '../../application/services/ProcessingOrchestrator';
import {
  UploadVoiceNoteUseCase,
  ProcessVoiceNoteUseCase,
  GetVoiceNoteUseCase,
  ListVoiceNotesUseCase,
  DeleteVoiceNoteUseCase,
  ReprocessVoiceNoteUseCase,
  ExportVoiceNoteUseCase
} from '../../application/use-cases';

export class Container {
  private static instance: Container;
  private config: Config;
  private prisma: PrismaClient;
  private observability: CompositeObservabilityProvider;
  
  private voiceNoteRepository: VoiceNoteRepositoryImpl;
  private userRepository: UserRepositoryImpl;
  private eventStore: EventStoreImpl;
  private transcriptionService: WhisperAdapter;
  private summarizationService: LLMAdapter;
  private storageService: LocalStorageAdapter;
  private processingOrchestrator: ProcessingOrchestrator;
  
  private constructor() {
    this.config = ConfigLoader.load();
    
    this.prisma = DatabaseClient.getInstance();
    
    this.observability = new CompositeObservabilityProvider([
      new LangSmithObservabilityProvider(this.config),
      new OpenLLMetryObservabilityProvider(this.config)
    ]);
    
    this.voiceNoteRepository = new VoiceNoteRepositoryImpl(this.prisma);
    this.userRepository = new UserRepositoryImpl(this.prisma);
    this.eventStore = new EventStoreImpl(this.prisma);
    
    this.transcriptionService = new WhisperAdapter();
    this.summarizationService = new LLMAdapter();
    this.storageService = new LocalStorageAdapter();
    
    this.processingOrchestrator = new ProcessingOrchestrator(
      this.transcriptionService,
      this.summarizationService,
      this.voiceNoteRepository,
      this.eventStore,
      this.config  // Pass the ConfigLoader instance
    );
  }
  
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  
  getConfig(): Config {
    return this.config;
  }
  
  getPrisma(): PrismaClient {
    if (!this.prisma) {
      console.error('Container.getPrisma(): prisma is undefined!');
      throw new Error('PrismaClient not initialized in Container');
    }
    return this.prisma;
  }
  
  getObservability(): CompositeObservabilityProvider {
    return this.observability;
  }
  
  getUserRepository(): UserRepositoryImpl {
    return this.userRepository;
  }
  
  getUploadVoiceNoteUseCase(): UploadVoiceNoteUseCase {
    return new UploadVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.storageService,
      this.eventStore,
      this.config  // Pass the ConfigLoader instance
    );
  }
  
  getProcessVoiceNoteUseCase(): ProcessVoiceNoteUseCase {
    return new ProcessVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.processingOrchestrator,
      this.eventStore
    );
  }
  
  getGetVoiceNoteUseCase(): GetVoiceNoteUseCase {
    return new GetVoiceNoteUseCase(this.voiceNoteRepository);
  }
  
  getListVoiceNotesUseCase(): ListVoiceNotesUseCase {
    return new ListVoiceNotesUseCase(this.voiceNoteRepository);
  }
  
  getDeleteVoiceNoteUseCase(): DeleteVoiceNoteUseCase {
    return new DeleteVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.storageService,
      this.eventStore
    );
  }
  
  getReprocessVoiceNoteUseCase(): ReprocessVoiceNoteUseCase {
    return new ReprocessVoiceNoteUseCase(
      this.voiceNoteRepository,
      this.processingOrchestrator,
      this.eventStore
    );
  }
  
  getExportVoiceNoteUseCase(): ExportVoiceNoteUseCase {
    return new ExportVoiceNoteUseCase(this.voiceNoteRepository);
  }
  
  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}