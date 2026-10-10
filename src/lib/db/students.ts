import { query } from '@/lib/db';
import { StudentRowInput } from '@/lib/validations/student';

export interface EnrolledStudentItem {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  enrollment_status: string;
  enrolled_at: string;
}

/**
 * Retrieves all students actively enrolled in a specific batch.
 */
export async function getStudentsByBatchId(batchId: string): Promise<EnrolledStudentItem[]> {
  const sql = `
    SELECT 
      s.id,
      s.roll_number,
      s.full_name,
      s.email,
      s.phone,
      s.department,
      s.year_or_semester,
      bs.status as enrollment_status,
      bs.enrolled_at::text as enrolled_at
    FROM batch_students bs
    JOIN students s ON s.id = bs.student_id
    WHERE bs.batch_id = $1
    ORDER BY s.roll_number ASC, s.full_name ASC
  `;

  return query<EnrolledStudentItem>(sql, [batchId]);
}

/**
 * Bulk enrolls an array of students into a college and batch.
 * Handles upsert on duplicate roll numbers within the college and links to batch_students.
 */
export async function enrollStudentsBulk(
  batchId: string,
  collegeId: string,
  students: StudentRowInput[]
): Promise<{ totalProcessed: number; newlyEnrolled: number }> {
  let newlyEnrolledCount = 0;

  for (const row of students) {
    const rollNo = row.rollNumber.trim().toUpperCase();
    const fullName = row.fullName.trim();
    const email = row.email?.trim().toLowerCase() || null;
    const phone = row.phone?.trim() || null;
    const department = row.department?.trim().toUpperCase() || null;
    const yearOrSemester = row.yearOrSemester?.trim() || null;

    // 1. Upsert into master students table
    const upsertSql = `
      INSERT INTO students (college_id, roll_number, full_name, email, phone, department, year_or_semester)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (college_id, LOWER(TRIM(roll_number)))
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = COALESCE(EXCLUDED.email, students.email),
        phone = COALESCE(EXCLUDED.phone, students.phone),
        department = COALESCE(EXCLUDED.department, students.department),
        year_or_semester = COALESCE(EXCLUDED.year_or_semester, students.year_or_semester),
        updated_at = NOW()
      RETURNING id
    `;

    const studentRes = await query<{ id: string }>(upsertSql, [
      collegeId,
      rollNo,
      fullName,
      email,
      phone,
      department,
      yearOrSemester,
    ]);

    if (studentRes.length > 0) {
      const studentId = studentRes[0].id;

      // 2. Link to batch_students
      const linkSql = `
        INSERT INTO batch_students (batch_id, student_id, status)
        VALUES ($1, $2, 'enrolled')
        ON CONFLICT (batch_id, student_id) DO NOTHING
        RETURNING id
      `;

      const linkRes = await query<{ id: string }>(linkSql, [batchId, studentId]);
      if (linkRes.length > 0) {
        newlyEnrolledCount++;
      }
    }
  }

  return {
    totalProcessed: students.length,
    newlyEnrolled: newlyEnrolledCount,
  };
}

/**
 * Removes a student's enrollment from a specific batch.
 */
export async function removeStudentFromBatch(
  batchId: string,
  studentId: string
): Promise<boolean> {
  const res = await query(
    `DELETE FROM batch_students WHERE batch_id = $1 AND student_id = $2 RETURNING id`,
    [batchId, studentId]
  );
  return res.length > 0;
}

export interface CollegeStudentItem {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  batches_count: number;
  batch_codes: string | null;
  created_at: string;
}

/**
 * Retrieves all students registered at a college, with their batch enrollments.
 */
export async function getStudentsByCollegeId(collegeId: string): Promise<CollegeStudentItem[]> {
  const sql = `
    SELECT 
      s.id,
      s.roll_number,
      s.full_name,
      s.email,
      s.phone,
      s.department,
      s.year_or_semester,
      COUNT(DISTINCT bs.batch_id)::int as batches_count,
      STRING_AGG(DISTINCT b.code, ', ') as batch_codes,
      s.created_at::text as created_at
    FROM students s
    LEFT JOIN batch_students bs ON bs.student_id = s.id
    LEFT JOIN batches b ON b.id = bs.batch_id
    WHERE s.college_id = $1
    GROUP BY s.id
    ORDER BY s.roll_number ASC, s.full_name ASC
  `;

  return query<CollegeStudentItem>(sql, [collegeId]);
}

