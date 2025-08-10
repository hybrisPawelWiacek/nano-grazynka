import { EventStoreImpl } from '../EventStoreImpl';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { prisma } from '../../database/client';

jest.mock('../../database/client', () => ({
  prisma: {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('EventStoreImpl', () => {
  let eventStore: EventStoreImpl;
  let mockPrisma: any;

  beforeEach(() => {
    eventStore = new EventStoreImpl();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('append', () => {
    it('should append a domain event', async () => {
      const event: DomainEvent = {
        eventId: 'event123',
        aggregateId: 'agg123',
        eventType: 'VoiceNoteUploaded',
        payload: { userId: 'user123' },
        occurredAt: new Date(),
      };

      await eventStore.append(event);

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event123',
          aggregateId: 'agg123',
          eventType: 'VoiceNoteUploaded',
          payload: JSON.stringify({ userId: 'user123' }),
          occurredAt: event.occurredAt,
        },
      });
    });
  });

  describe('getEvents', () => {
    it('should return events for an aggregate', async () => {
      const dbEvents = [
        {
          eventId: 'event1',
          aggregateId: 'agg123',
          eventType: 'VoiceNoteUploaded',
          payload: JSON.stringify({ userId: 'user123' }),
          occurredAt: new Date(),
        },
        {
          eventId: 'event2',
          aggregateId: 'agg123',
          eventType: 'VoiceNoteProcessed',
          payload: JSON.stringify({ status: 'completed' }),
          occurredAt: new Date(),
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(dbEvents);

      const result = await eventStore.getEvents('agg123');

      expect(result).toHaveLength(2);
      expect(result[0].eventId).toBe('event1');
      expect(result[1].eventId).toBe('event2');
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { aggregateId: 'agg123' },
        orderBy: { occurredAt: 'asc' },
      });
    });
  });

  describe('getEventsByType', () => {
    it('should return events by type with pagination', async () => {
      const dbEvents = [
        {
          eventId: 'event1',
          aggregateId: 'agg123',
          eventType: 'VoiceNoteUploaded',
          payload: JSON.stringify({ userId: 'user123' }),
          occurredAt: new Date(),
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(dbEvents);

      const result = await eventStore.getEventsByType('VoiceNoteUploaded', {
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveLength(1);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { eventType: 'VoiceNoteUploaded' },
        take: 10,
        skip: 0,
        orderBy: { occurredAt: 'desc' },
      });
    });

    it('should filter events by date', async () => {
      const since = new Date('2024-01-01');
      mockPrisma.event.findMany.mockResolvedValue([]);

      await eventStore.getEventsByType('VoiceNoteUploaded', { since });

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          eventType: 'VoiceNoteUploaded',
          occurredAt: { gte: since },
        },
        take: 100,
        skip: 0,
        orderBy: { occurredAt: 'desc' },
      });
    });
  });

  describe('getLastEvent', () => {
    it('should return the last event for an aggregate', async () => {
      const dbEvent = {
        eventId: 'event1',
        aggregateId: 'agg123',
        eventType: 'VoiceNoteCompleted',
        payload: JSON.stringify({ status: 'completed' }),
        occurredAt: new Date(),
      };

      mockPrisma.event.findFirst.mockResolvedValue(dbEvent);

      const result = await eventStore.getLastEvent('agg123');

      expect(result).not.toBeNull();
      expect(result?.eventId).toBe('event1');
      expect(mockPrisma.event.findFirst).toHaveBeenCalledWith({
        where: { aggregateId: 'agg123' },
        orderBy: { occurredAt: 'desc' },
      });
    });

    it('should return null when no events exist', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null);

      const result = await eventStore.getLastEvent('agg123');

      expect(result).toBeNull();
    });
  });
});