import { z } from 'zod';

export const resourceSchema = z.object({
  batchId: z.string().uuid('Invalid batch reference'),
  name: z.string().trim().min(2, 'Resource title must be at least 2 characters'),
  type: z
    .enum(['google_drive', 'document', 'video', 'link'])
    .default('google_drive'),
  url: z
    .string()
    .trim()
    .url('Please provide a valid URL (e.g. https://drive.google.com/...)'),
  description: z.string().trim().optional().or(z.literal('')),
});

export type ResourceInput = z.infer<typeof resourceSchema>;
