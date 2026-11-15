import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const deleteStudentModeSchema = z.enum(['archive', 'permanent']);

/**
 * Validates that a dynamic identifier is a valid UUID before interpolating
 * it into backend URLs or Next.js cache paths. Never reflects user input in errors.
 */
export function assertUuid(value: unknown, label = 'ID'): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${label}: expected a valid UUID.`);
  }
  return parsed.data;
}

