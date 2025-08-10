import { randomUUID } from 'crypto';

export class VoiceNoteId {
  private constructor(private readonly value: string) {}

  static create(): VoiceNoteId {
    return new VoiceNoteId(randomUUID());
  }

  static generate(): VoiceNoteId {
    return VoiceNoteId.create();
  }

  static fromString(value: string): VoiceNoteId {
    if (!value || value.trim().length === 0) {
      throw new Error('VoiceNoteId cannot be empty');
    }
    return new VoiceNoteId(value);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: VoiceNoteId): boolean {
    return this.value === other.value;
  }
}