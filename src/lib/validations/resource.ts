import { z } from 'zod';

export const resourceSchema = z
  .object({
    batchId: z.string().uuid('Invalid batch reference'),
    title: z.string().trim().min(2, 'Resource title must be at least 2 characters').optional().or(z.literal('')),
    name: z.string().trim().min(2, 'Resource title must be at least 2 characters').optional().or(z.literal('')),
    type: z
      .enum(['google_drive', 'document', 'video', 'link'])
      .default('google_drive'),
    url: z
      .string()
      .trim()
      .url('Please provide a valid URL (e.g. https://drive.google.com/...)'),
    description: z.string().trim().optional().or(z.literal('')),
  })
  .refine(
    (data) => Boolean((data.title && data.title.length >= 2) || (data.name && data.name.length >= 2)),
    {
      message: 'Resource title must be at least 2 characters',
      path: ['title'],
    }
  );

export interface ResourceInput {
  batchId: string;
  title?: string;
  name?: string;
  type?: 'google_drive' | 'document' | 'video' | 'link';
  url: string;
  description?: string | null;
}
