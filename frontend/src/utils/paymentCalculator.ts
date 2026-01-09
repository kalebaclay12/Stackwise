type PaymentFrequency = 'daily' | 'every_other_day' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'semi_annually' | 'annually';

interface PaymentCalculation {
  amountPerPayment: number;
  paymentsRemaining: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

/**
 * Round up to the nearest cent (always round up, never down)
 * Example: 21.6712 -> 21.68, 21.671 -> 21.68
 */
function roundUpToCent(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

/**
 * Calculate the number of days between two dates
 */
function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate how many payments will occur between two dates based on frequency
 * This counts the actual number of payment periods that fit between the start and end date
 */
function calculatePaymentsBetweenDates(
  startDate: Date,
  endDate: Date,
  frequency: PaymentFrequency
): number {
  const days = getDaysBetween(startDate, endDate);

  if (days <= 0) return 1; // If due today or past, at least 1 payment

  let paymentsRemaining: number;

  switch (frequency) {
    case 'daily':
      // Number of days between start and end (inclusive)
      paymentsRemaining = days;
      break;
    case 'every_other_day':
      // Every other day
      paymentsRemaining = Math.ceil(days / 2);
      break;
    case 'weekly':
      // Every 7 days
      paymentsRemaining = Math.ceil(days / 7);
      break;
    case 'bi_weekly':
      // Every 14 days
      paymentsRemaining = Math.ceil(days / 14);
      break;
    case 'bi_monthly':
      // Twice a month (approximately every 15 days)
      paymentsRemaining = Math.ceil(days / 15);
      break;
    case 'monthly':
      // Every 30 days
      paymentsRemaining = Math.ceil(days / 30);
      break;
    case 'semi_annually':
      // Every 6 months (approximately 182.5 days)
      paymentsRemaining = Math.ceil(days / 182.5);
      break;
    case 'annually':
      // Every year (365 days)
      paymentsRemaining = Math.ceil(days / 365);
      break;
    default:
      paymentsRemaining = 1;
  }

  return Math.max(1, paymentsRemaining);
}

/**
 * Calculate how much needs to be saved per payment period to reach a target amount by a due date
 * If firstPaymentDate is provided, calculations are based on that date instead of today
 */
export function calculatePaymentAmount(
  targetAmount: number,
  currentAmount: number,
  dueDate: Date,
  frequency: PaymentFrequency,
  firstPaymentDate?: Date
): PaymentCalculation {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  // Use first payment date if provided, otherwise use today
  const startDate = firstPaymentDate ? new Date(firstPaymentDate) : now;
  startDate.setHours(0, 0, 0, 0);

  const daysUntilDue = getDaysBetween(now, due);
  const isOverdue = daysUntilDue < 0;

  // Amount still needed
  const amountNeeded = Math.max(0, targetAmount - currentAmount);

  // If already have enough or past due date
  if (amountNeeded === 0 || isOverdue) {
    return {
      amountPerPayment: 0,
      paymentsRemaining: 0,
      daysUntilDue,
      isOverdue,
    };
  }

  // Calculate number of payments between start date and due date
  const paymentsRemaining = calculatePaymentsBetweenDates(startDate, due, frequency);

  // Calculate amount per payment and always round UP to the higher cent
  const rawAmountPerPayment = amountNeeded / paymentsRemaining;
  const amountPerPayment = roundUpToCent(rawAmountPerPayment);

  return {
    amountPerPayment,
    paymentsRemaining,
    daysUntilDue,
    isOverdue,
  };
}

/**
 * Format the payment frequency for display
 */
export function getFrequencyLabel(frequency: PaymentFrequency): string {
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'every_other_day':
      return 'Every Other Day';
    case 'weekly':
      return 'Weekly';
    case 'bi_weekly':
      return 'Bi-Weekly';
    case 'bi_monthly':
      return 'Bi-Monthly';
    case 'monthly':
      return 'Monthly';
    case 'semi_annually':
      return 'Semi-Annually';
    case 'annually':
      return 'Annually';
    default:
      return 'Unknown';
  }
}

/**
 * Get a user-friendly description of the due date
 */
export function formatDaysUntilDue(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return 'Due tomorrow';
  } else if (days <= 7) {
    return `Due in ${days} days`;
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `Due in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    const months = Math.floor(days / 30);
    return `Due in ${months} ${months === 1 ? 'month' : 'months'}`;
  }
}
