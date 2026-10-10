import { z } from 'zod';

export const collegeSchema = z.object({
  name: z.string().trim().min(2, 'College name must be at least 2 characters'),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  contactName: z.string().trim().optional().or(z.literal('')),
  contactEmail: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  logoUrl: z
    .string()
    .trim()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CollegeInput = z.infer<typeof collegeSchema>;
