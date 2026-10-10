import { z } from 'zod';

export const batchSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Batch code is required (e.g. DA-TRI-2026-01)'),
    collegeId: z.string().uuid('Please select a valid college'),
    programId: z.string().uuid('Please select a valid program'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    targetStrength: z
      .coerce
      .number()
      .int('Target strength must be an integer')
      .min(0, 'Target strength cannot be negative')
      .default(60),
    status: z
      .enum(['planned', 'active', 'completed', 'cancelled'])
      .default('planned'),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export type BatchInput = z.infer<typeof batchSchema>;
