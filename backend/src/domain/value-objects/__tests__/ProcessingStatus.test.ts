import { ProcessingStatus, ProcessingStatusValue } from '../ProcessingStatus';

describe('ProcessingStatus', () => {
  describe('static instances', () => {
    it('should have all status static instances', () => {
      expect(ProcessingStatus.PENDING.getValue()).toBe(ProcessingStatusValue.PENDING);
      expect(ProcessingStatus.PROCESSING.getValue()).toBe(ProcessingStatusValue.PROCESSING);
      expect(ProcessingStatus.COMPLETED.getValue()).toBe(ProcessingStatusValue.COMPLETED);
      expect(ProcessingStatus.FAILED.getValue()).toBe(ProcessingStatusValue.FAILED);
    });
  });

  describe('fromString', () => {
    it('should create ProcessingStatus from valid string', () => {
      expect(ProcessingStatus.fromString('pending').equals(ProcessingStatus.PENDING)).toBe(true);
      expect(ProcessingStatus.fromString('processing').equals(ProcessingStatus.PROCESSING)).toBe(true);
      expect(ProcessingStatus.fromString('completed').equals(ProcessingStatus.COMPLETED)).toBe(true);
      expect(ProcessingStatus.fromString('failed').equals(ProcessingStatus.FAILED)).toBe(true);
    });

    it('should throw error for invalid status', () => {
      expect(() => ProcessingStatus.fromString('invalid')).toThrow('Invalid processing status: invalid');
    });
  });

  describe('status check methods', () => {
    it('should correctly identify pending status', () => {
      expect(ProcessingStatus.PENDING.isPending()).toBe(true);
      expect(ProcessingStatus.PENDING.isProcessing()).toBe(false);
      expect(ProcessingStatus.PENDING.isCompleted()).toBe(false);
      expect(ProcessingStatus.PENDING.isFailed()).toBe(false);
    });

    it('should correctly identify processing status', () => {
      expect(ProcessingStatus.PROCESSING.isPending()).toBe(false);
      expect(ProcessingStatus.PROCESSING.isProcessing()).toBe(true);
      expect(ProcessingStatus.PROCESSING.isCompleted()).toBe(false);
      expect(ProcessingStatus.PROCESSING.isFailed()).toBe(false);
    });

    it('should correctly identify completed status', () => {
      expect(ProcessingStatus.COMPLETED.isPending()).toBe(false);
      expect(ProcessingStatus.COMPLETED.isProcessing()).toBe(false);
      expect(ProcessingStatus.COMPLETED.isCompleted()).toBe(true);
      expect(ProcessingStatus.COMPLETED.isFailed()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      expect(ProcessingStatus.FAILED.isPending()).toBe(false);
      expect(ProcessingStatus.FAILED.isProcessing()).toBe(false);
      expect(ProcessingStatus.FAILED.isCompleted()).toBe(false);
      expect(ProcessingStatus.FAILED.isFailed()).toBe(true);
    });
  });

  describe('isTerminal', () => {
    it('should identify terminal states', () => {
      expect(ProcessingStatus.PENDING.isTerminal()).toBe(false);
      expect(ProcessingStatus.PROCESSING.isTerminal()).toBe(false);
      expect(ProcessingStatus.COMPLETED.isTerminal()).toBe(true);
      expect(ProcessingStatus.FAILED.isTerminal()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return status value as string', () => {
      expect(ProcessingStatus.PENDING.toString()).toBe('pending');
      expect(ProcessingStatus.PROCESSING.toString()).toBe('processing');
      expect(ProcessingStatus.COMPLETED.toString()).toBe('completed');
      expect(ProcessingStatus.FAILED.toString()).toBe('failed');
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      expect(ProcessingStatus.PENDING.equals(ProcessingStatus.PENDING)).toBe(true);
      expect(ProcessingStatus.COMPLETED.equals(ProcessingStatus.COMPLETED)).toBe(true);
    });

    it('should return false for different statuses', () => {
      expect(ProcessingStatus.PENDING.equals(ProcessingStatus.COMPLETED)).toBe(false);
      expect(ProcessingStatus.PROCESSING.equals(ProcessingStatus.FAILED)).toBe(false);
    });
  });
});