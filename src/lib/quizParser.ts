import * as XLSX from 'xlsx';

export interface ParsedQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0, 1, 2, or 3
  points: number;
  explanation?: string;
}

export interface ParseResult {
  success: boolean;
  questions: ParsedQuizQuestion[];
  errors: string[];
  totalParsed: number;
}

/**
 * Parses questions from an ArrayBuffer of a CSV or Excel file (.xlsx, .xls).
 * Handles flexible column naming (e.g. "Question", "Option A", "Correct Answer").
 */
export function parseQuizQuestionsFile(buffer: ArrayBuffer): ParseResult {
  const errors: string[] = [];
  const questions: ParsedQuizQuestion[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, questions: [], errors: ['No sheet found in workbook.'], totalParsed: 0 };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      return { success: false, questions: [], errors: ['The uploaded file is empty.'], totalParsed: 0 };
    }

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-based index including header row

      // Find Question text
      const questionText = (
        row['Question'] ||
        row['question'] ||
        row['Question Text'] ||
        row['QUESTION'] ||
        row['Prompt'] ||
        ''
      ).toString().trim();

      if (!questionText) {
        // Skip empty rows
        return;
      }

      // Find Options A, B, C, D
      const optA = (row['Option A'] || row['option a'] || row['A'] || row['Option 1'] || row['option 1'] || '').toString().trim();
      const optB = (row['Option B'] || row['option b'] || row['B'] || row['Option 2'] || row['option 2'] || '').toString().trim();
      const optC = (row['Option C'] || row['option c'] || row['C'] || row['Option 3'] || row['option 3'] || '').toString().trim();
      const optD = (row['Option D'] || row['option d'] || row['D'] || row['Option 4'] || row['option 4'] || '').toString().trim();

      const options: string[] = [];
      if (optA) options.push(optA);
      if (optB) options.push(optB);
      if (optC) options.push(optC);
      if (optD) options.push(optD);

      if (options.length < 2) {
        errors.push(`Row ${rowNum}: Question "${questionText.slice(0, 30)}..." must have at least 2 options.`);
        return;
      }

      // Determine Correct Option Index
      const rawCorrect = (
        row['Correct Option'] ||
        row['correct option'] ||
        row['Correct Answer'] ||
        row['Answer'] ||
        row['CORRECT'] ||
        row['Key'] ||
        'A'
      ).toString().trim();

      let correctIndex = 0;
      const upperCorrect = rawCorrect.toUpperCase();

      if (upperCorrect === 'A' || upperCorrect === 'OPTION A' || upperCorrect === '1') {
        correctIndex = 0;
      } else if (upperCorrect === 'B' || upperCorrect === 'OPTION B' || upperCorrect === '2') {
        correctIndex = 1;
      } else if (upperCorrect === 'C' || upperCorrect === 'OPTION C' || upperCorrect === '3') {
        correctIndex = 2;
      } else if (upperCorrect === 'D' || upperCorrect === 'OPTION D' || upperCorrect === '4') {
        correctIndex = 3;
      } else {
        // Try exact text match
        const matchIdx = options.findIndex((o) => o.toLowerCase() === rawCorrect.toLowerCase());
        if (matchIdx !== -1) {
          correctIndex = matchIdx;
        } else {
          // Default to Option A if unrecognizable
          correctIndex = 0;
        }
      }

      // Clamp correctIndex to valid option range
      if (correctIndex >= options.length) {
        correctIndex = 0;
      }

      // Points & explanation
      const rawPoints = row['Points'] || row['points'] || row['Marks'] || row['marks'] || 1;
      const points = Math.max(1, parseInt(rawPoints, 10) || 1);

      const explanation = (
        row['Explanation'] ||
        row['explanation'] ||
        row['Rationale'] ||
        row['Notes'] ||
        ''
      ).toString().trim();

      questions.push({
        id: `q_${questions.length + 1}`,
        question: questionText,
        options,
        correctOptionIndex: correctIndex,
        points,
        explanation: explanation || undefined,
      });
    });

    if (questions.length === 0) {
      errors.push('No valid questions could be extracted. Please check the columns against the sample template.');
    }

    return {
      success: questions.length > 0,
      questions,
      errors,
      totalParsed: questions.length,
    };
  } catch (err: any) {
    return {
      success: false,
      questions: [],
      errors: [err.message || 'Failed to parse file.'],
      totalParsed: 0,
    };
  }
}

/**
 * Generates sample CSV text that trainers can download.
 */
export function generateSampleQuizCSV(): string {
  const rows = [
    ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Points', 'Explanation'],
    ['What does SQL stand for?', 'Structured Query Language', 'Strong Question Logic', 'Sequential Query List', 'Simple Query Layout', 'A', '1', 'SQL is the standard language for relational database management.'],
    ['Which clause is used to filter records after aggregate functions in SQL?', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'B', '1', 'HAVING filters aggregated groups, whereas WHERE filters individual rows.'],
    ['What is a Primary Key in relational databases?', 'A unique identifier for each row in a table', 'A foreign key from another table', 'An index for full text only', 'A nullable column', 'A', '1', 'Primary keys enforce entity integrity and uniquely identify rows.'],
    ['Which JOIN returns all records from both tables when there is a match in either table?', 'INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'C', '1', 'FULL OUTER JOIN returns matching and non-matching rows from both tables.'],
    ['Which normal form eliminates partial functional dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'B', '1', 'Second Normal Form (2NF) eliminates partial dependency on a composite key.'],
  ];

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
