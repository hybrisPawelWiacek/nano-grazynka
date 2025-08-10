export enum ProcessingStatusValue {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class ProcessingStatus {
  private constructor(private readonly value: ProcessingStatusValue) {}

  static PENDING = new ProcessingStatus(ProcessingStatusValue.PENDING);
  static PROCESSING = new ProcessingStatus(ProcessingStatusValue.PROCESSING);
  static COMPLETED = new ProcessingStatus(ProcessingStatusValue.COMPLETED);
  static FAILED = new ProcessingStatus(ProcessingStatusValue.FAILED);

  static fromString(value: string): ProcessingStatus {
    switch (value) {
      case ProcessingStatusValue.PENDING:
        return ProcessingStatus.PENDING;
      case ProcessingStatusValue.PROCESSING:
        return ProcessingStatus.PROCESSING;
      case ProcessingStatusValue.COMPLETED:
        return ProcessingStatus.COMPLETED;
      case ProcessingStatusValue.FAILED:
        return ProcessingStatus.FAILED;
      default:
        throw new Error(`Invalid processing status: ${value}`);
    }
  }

  getValue(): ProcessingStatusValue {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ProcessingStatus): boolean {
    return this.value === other.value;
  }

  isPending(): boolean {
    return this.value === ProcessingStatusValue.PENDING;
  }

  isProcessing(): boolean {
    return this.value === ProcessingStatusValue.PROCESSING;
  }

  isCompleted(): boolean {
    return this.value === ProcessingStatusValue.COMPLETED;
  }

  isFailed(): boolean {
    return this.value === ProcessingStatusValue.FAILED;
  }

  isTerminal(): boolean {
    return this.isCompleted() || this.isFailed();
  }
}