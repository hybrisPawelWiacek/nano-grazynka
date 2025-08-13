import { UseCase } from '../base/UseCase';
import { Result, NotFoundError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { VoiceNote } from '../../domain/entities/VoiceNote';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';

export interface GetVoiceNoteInput {
  voiceNoteId: string;
  includeTranscription?: boolean;
  includeSummary?: boolean;
}

export interface GetVoiceNoteOutput {
  id: string;
  userId?: string;
  sessionId?: string;  // Add sessionId field
  title: string;
  originalFilePath?: string;
  fileSize: number;
  mimeType: string;
  language: string;
  status: string;
  tags: string[];
  errorMessage?: string;
  userPrompt?: string;  // Custom user prompt
  whisperPrompt?: string;  // Whisper prompt for GPT-4o
  transcriptionModel?: string;  // Model selection
  geminiSystemPrompt?: string;  // Gemini system prompt
  geminiUserPrompt?: string;  // Gemini user prompt
  refinedText?: string;  // Refined transcription
  refinementPrompt?: string;  // Refinement prompt
  createdAt: Date;
  updatedAt: Date;
  version: number;
  transcription?: {
    id: string;
    text: string;
    language: string;
    wordCount?: number;
    confidence?: number;
    duration?: number;
  };
  summary?: {
    id: string;
    summary: string;
    keyPoints: string[];
    actionItems: Array<{
      title: string;
      owner?: string;
      dueDate?: string;
      priority?: string;
      project?: string;
    }>;
    language: string;
    timestamp?: Date;
  };
}

export class GetVoiceNoteUseCase extends UseCase<
  GetVoiceNoteInput,
  Result<GetVoiceNoteOutput>
> {
  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository
  ) {
    super();
  }

  async execute(input: GetVoiceNoteInput): Promise<Result<GetVoiceNoteOutput>> {
    try {
      // Find voice note
      const voiceNoteId = VoiceNoteId.fromString(input.voiceNoteId);
      const voiceNote = await this.voiceNoteRepository.findById(voiceNoteId);

      if (!voiceNote) {
        return {
          success: false,
          error: new NotFoundError(`Voice note with ID ${input.voiceNoteId} not found`)
        };
      }

      // Build output
      const output: GetVoiceNoteOutput = {
        id: voiceNote.getId().toString(),
        userId: voiceNote.getUserId(),
        sessionId: voiceNote.getSessionId(),  // Include sessionId
        title: voiceNote.getTitle(),
        originalFilePath: voiceNote.getOriginalFilePath(),
        fileSize: voiceNote.getFileSize(),
        mimeType: voiceNote.getMimeType(),
        language: voiceNote.getLanguage().getValue(),
        status: voiceNote.getStatus().getValue(),
        tags: voiceNote.getTags(),
        errorMessage: voiceNote.getErrorMessage(),
        userPrompt: voiceNote.getUserPrompt(),  // Include custom prompt
        whisperPrompt: voiceNote.getWhisperPrompt(),  // Include Whisper prompt
        transcriptionModel: voiceNote.getTranscriptionModel(),  // Include model selection
        geminiSystemPrompt: voiceNote.getGeminiSystemPrompt(),  // Include Gemini system prompt
        geminiUserPrompt: voiceNote.getGeminiUserPrompt(),  // Include Gemini user prompt
        refinedText: voiceNote.getRefinedText(),  // Include refined text
        refinementPrompt: voiceNote.getRefinementPrompt(),  // Include refinement prompt
        createdAt: voiceNote.getCreatedAt(),
        updatedAt: voiceNote.getUpdatedAt(),
        version: voiceNote.getVersion()
      };
      


      // Include transcription if requested
      if (input.includeTranscription) {
        const transcription = voiceNote.getTranscription();
        if (transcription) {
          output.transcription = {
            id: voiceNote.getId().toString(), // Use voice note ID as reference
            text: transcription.getText(),
            language: transcription.getLanguage().getValue(),
            wordCount: transcription.getWordCount(),
            confidence: transcription.getConfidence(),
            duration: transcription.getDuration()
          };
        }
      }

      // Include summary if requested
      if (input.includeSummary) {
        const summary = voiceNote.getSummary();
        if (summary) {
          output.summary = {
            id: voiceNote.getId().toString(), // Use voice note ID as reference
            summary: summary.getSummary(),
            keyPoints: summary.getKeyPoints(),
            actionItems: summary.getActionItems(),
            language: summary.getLanguage().getValue(),
            timestamp: summary.getTimestamp()
          };
        }
      }

      return {
        success: true,
        data: output
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
}