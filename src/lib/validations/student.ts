import { z } from 'zod';

export const studentRowSchema = z.object({
  rollNumber: z.string().trim().min(1, 'Roll number is required'),
  fullName: z.string().trim().min(2, 'Student full name is required'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email')
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z.string().trim().optional().or(z.literal('')).nullable(),
  department: z.string().trim().optional().or(z.literal('')).nullable(),
  yearOrSemester: z.string().trim().optional().or(z.literal('')).nullable(),
});

export const bulkStudentUploadSchema = z.object({
  batchId: z.string().uuid('Invalid batch ID'),
  collegeId: z.string().uuid('Invalid college ID'),
  students: z.array(studentRowSchema).min(1, 'At least 1 student row is required'),
});

export type StudentRowInput = z.infer<typeof studentRowSchema>;
export type BulkStudentUploadInput = z.infer<typeof bulkStudentUploadSchema>;
