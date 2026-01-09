export type AllocationFrequency =
  | 'daily'
  | 'every_other_day'
  | 'weekly'
  | 'bi_weekly'
  | 'bi_monthly'
  | 'monthly'
  | 'semi_annually'
  | 'annually';

export function calculateNextAllocationDate(
  currentDate: Date,
  frequency: AllocationFrequency
): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'every_other_day':
      nextDate.setDate(nextDate.getDate() + 2);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi_weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'bi_monthly':
      nextDate.setDate(nextDate.getDate() + 15);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'semi_annually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}
