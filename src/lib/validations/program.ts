import { z } from 'zod';

export const programSchema = z.object({
  name: z.string().trim().min(2, 'Program name must be at least 2 characters'),
  description: z.string().trim().optional().or(z.literal('')),
  durationDays: z
    .coerce
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 day')
    .default(30),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type ProgramInput = z.infer<typeof programSchema>;
