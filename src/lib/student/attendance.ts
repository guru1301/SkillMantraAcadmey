/**
 * Single source of truth for student attendance calculations in the student portal.
 * Shared across Home, Course, and Certificate views to guarantee consistent numbers.
 */

export interface AttendanceCalculationResult {
  attended: number;
  total: number;
  percentage: number;
  requiredPercentage: number;
  isEligible: boolean;
  statusSentence: string;
  classesCanMiss: number;
  consecutiveClassesNeeded: number;
}

/**
 * Calculates standard educational attendance metrics and the exact number of classes
 * a student can miss (or must attend consecutively) to satisfy the institutional requirement.
 *
 * @param attended - Number of attended classes (present + late)
 * @param total - Total recorded session evaluations (present + absent + late + excused)
 * @param requiredPercentage - Institutional certification threshold (defaults to 80%)
 */
export function calculateAttendanceStatus(
  attended: number,
  total: number,
  requiredPercentage: number = 80
): AttendanceCalculationResult {
  const safeAttended = Math.max(0, attended);
  const safeTotal = Math.max(0, total);
  const percentage = safeTotal > 0 ? Math.round((safeAttended / safeTotal) * 100) : 0;
  const isEligible = percentage >= requiredPercentage;
  const reqFraction = requiredPercentage / 100;

  let classesCanMiss = 0;
  let consecutiveClassesNeeded = 0;
  let statusSentence = '';

  if (safeTotal === 0) {
    statusSentence = 'No classes recorded yet';
  } else if (isEligible) {
    // Maximum additional classes the student can miss without dropping below requiredPercentage:
    // safeAttended / (safeTotal + m) >= reqFraction
    // safeTotal + m <= safeAttended / reqFraction
    // m = floor(safeAttended / reqFraction) - safeTotal
    const maxTotalAllowable = Math.floor(safeAttended / reqFraction);
    classesCanMiss = Math.max(0, maxTotalAllowable - safeTotal);

    if (classesCanMiss === 0) {
      statusSentence = 'You can miss 0 more classes';
    } else if (classesCanMiss === 1) {
      statusSentence = 'You can miss 1 more class';
    } else {
      statusSentence = `You can miss ${classesCanMiss} more classes`;
    }
  } else {
    // Number of consecutive attended classes (x) needed to bring the ratio back up to requiredPercentage:
    // (safeAttended + x) / (safeTotal + x) >= reqFraction
    // safeAttended + x >= reqFraction * safeTotal + reqFraction * x
    // x * (1 - reqFraction) >= reqFraction * safeTotal - safeAttended
    // x = ceil((reqFraction * safeTotal - safeAttended) / (1 - reqFraction))
    const deficit = reqFraction * safeTotal - safeAttended;
    const needed = deficit / (1 - reqFraction);
    consecutiveClassesNeeded = Math.max(1, Math.ceil(needed));

    if (consecutiveClassesNeeded === 1) {
      statusSentence = 'Need 1 class in a row to reach 80%';
    } else {
      statusSentence = `Need ${consecutiveClassesNeeded} classes in a row to reach 80%`;
    }
  }

  return {
    attended: safeAttended,
    total: safeTotal,
    percentage,
    requiredPercentage,
    isEligible,
    statusSentence,
    classesCanMiss,
    consecutiveClassesNeeded,
  };
}
