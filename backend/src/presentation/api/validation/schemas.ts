import { z } from 'zod';

export const uploadVoiceNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    userId: z.string().default('default-user')
  })
});

export const processVoiceNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    language: z.enum(['EN', 'PL']).optional()
  }).optional()
});

export const getVoiceNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  querystring: z.object({
    includeTranscription: z.string().transform(val => val === 'true').optional(),
    includeSummary: z.string().transform(val => val === 'true').optional()
  }).optional()
});

export const listVoiceNotesSchema = z.object({
  querystring: z.object({
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('20'),
    search: z.string().optional(),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    userId: z.string().optional(),
    tags: z.string().transform(val => val ? val.split(',') : undefined).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }).optional()
});

export const deleteVoiceNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  querystring: z.object({
    keepAudioFile: z.string().transform(val => val === 'true').optional()
  }).optional()
});

export const reprocessVoiceNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    systemPrompt: z.string().optional(),
    userPrompt: z.string().optional(),
    model: z.string().optional(),
    language: z.enum(['EN', 'PL']).optional()
  }).optional()
});

export const exportVoiceNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  querystring: z.object({
    format: z.enum(['markdown', 'json']).default('markdown'),
    includeTranscription: z.string().transform(val => val === 'true').default('true'),
    includeSummary: z.string().transform(val => val === 'true').default('true'),
    includeMetadata: z.string().transform(val => val === 'true').default('true')
  }).optional()
});

export type UploadVoiceNoteInput = z.infer<typeof uploadVoiceNoteSchema>;
export type ProcessVoiceNoteInput = z.infer<typeof processVoiceNoteSchema>;
export type GetVoiceNoteInput = z.infer<typeof getVoiceNoteSchema>;
export type ListVoiceNotesInput = z.infer<typeof listVoiceNotesSchema>;
export type DeleteVoiceNoteInput = z.infer<typeof deleteVoiceNoteSchema>;
export type ReprocessVoiceNoteInput = z.infer<typeof reprocessVoiceNoteSchema>;
export type ExportVoiceNoteInput = z.infer<typeof exportVoiceNoteSchema>;