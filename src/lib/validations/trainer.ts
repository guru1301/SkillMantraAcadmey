import { z } from 'zod';

export const trainerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val && val.length > 0 ? val.toLowerCase() : null)),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  skills: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const batchTrainerAssignmentSchema = z.object({
  batchId: z.string().uuid('Invalid batch ID'),
  trainerId: z.string().uuid('Invalid trainer ID'),
  isLead: z.boolean().default(false),
  role: z.string().trim().optional(),
});

export type TrainerInput = z.infer<typeof trainerSchema>;
export type BatchTrainerAssignmentInput = z.infer<typeof batchTrainerAssignmentSchema>;
