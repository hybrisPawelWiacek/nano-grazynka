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
import { TitleGenerationAdapter } from '../../infrastructure/adapters/TitleGenerationAdapter';
import { AudioMetadataExtractor } from '../../infrastructure/adapters/AudioMetadataExtractor';
import { DatabaseClient } from '../../infrastructure/database/DatabaseClient';
import { ProcessingOrchestrator } from '../../application/services/ProcessingOrchestrator';
import {
  UploadVoiceNoteUseCase,
  ProcessVoiceNoteUseCase,
  GetVoiceNoteUseCase,
  ListVoiceNotesUseCase,
  DeleteVoiceNoteUseCase,
  ReprocessVoiceNoteUseCase,
  ExportVoiceNoteUseCase,
  MigrateAnonymousToUserUseCase
} from '../../application/use-cases';

import { PromptLoader } from '../../infrastructure/config/PromptLoader';

export class Container {
  private static instance: Container;
  private config: Config;
  private prisma: PrismaClient;
  private observability: CompositeObservabilityProvider;
  private promptLoader: PromptLoader;
  
  private voiceNoteRepository: VoiceNoteRepositoryImpl;
  private userRepository: UserRepositoryImpl;
  private eventStore: EventStoreImpl;
  private transcriptionService: WhisperAdapter;
  private summarizationService: LLMAdapter;
  private titleGenerationService: TitleGenerationAdapter;
  private storageService: LocalStorageAdapter;
  private audioMetadataExtractor: AudioMetadataExtractor;
  private processingOrchestrator: ProcessingOrchestrator;
  
  private constructor() {
    this.config = ConfigLoader.load();
    
    this.prisma = DatabaseClient.getInstance();
    
    // Initialize PromptLoader as singleton
    this.promptLoader = PromptLoader.getInstance();
    
    this.observability = new CompositeObservabilityProvider([
      new LangSmithObservabilityProvider(this.config),
      new OpenLLMetryObservabilityProvider(this.config)
    ]);
    
    this.voiceNoteRepository = new VoiceNoteRepositoryImpl(this.prisma);
    this.userRepository = new UserRepositoryImpl(this.prisma);
    this.eventStore = new EventStoreImpl(this.prisma);
    
    // Pass PromptLoader to adapters
    this.transcriptionService = new WhisperAdapter(this.promptLoader);
    this.summarizationService = new LLMAdapter(this.promptLoader);
    this.titleGenerationService = new TitleGenerationAdapter(this.config, this.promptLoader);
    this.storageService = new LocalStorageAdapter();
    this.audioMetadataExtractor = new AudioMetadataExtractor();
    
    this.processingOrchestrator = new ProcessingOrchestrator(
      this.transcriptionService,
      this.summarizationService,
      this.titleGenerationService,
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
  
  getPromptLoader(): PromptLoader {
    return this.promptLoader;
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
      this.config,  // Pass the ConfigLoader instance
      this.audioMetadataExtractor
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
  
  getMigrateAnonymousToUserUseCase(): MigrateAnonymousToUserUseCase {
    return new MigrateAnonymousToUserUseCase(
      this.prisma
    );
  }
  
  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}