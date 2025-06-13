import moment from "jalali-moment";

export interface PersianDate {
  year: number;
  month: number;
  day: number;
  formatted: string; // YYYY/MM/DD format
}

export interface TimelineCell {
  date: string;
  displayDate: string;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday?: boolean;
}

export const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const PERSIAN_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

export const PERSIAN_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/**
 * Get current Persian date
 */
export function getCurrentPersianDate(): PersianDate {
  const now = moment();
  return {
    year: now.jYear(),
    month: now.jMonth() + 1, // jalali-moment returns 0-based month
    day: now.jDate(),
    formatted: now.format("jYYYY/jMM/jDD"),
  };
}

/**
 * Parse Persian date string to PersianDate object
 */
export function parsePersianDate(dateString: string): PersianDate {
  const [year, month, day] = dateString.split("/").map(Number);
  return {
    year,
    month,
    day,
    formatted: dateString,
  };
}

/**
 * Format Persian date
 */
export function formatPersianDate(
  date: PersianDate,
  format = "jYYYY/jMM/jDD"
): string {
  const m = moment.from(
    `${date.year}/${date.month}/${date.day}`,
    "fa",
    "YYYY/MM/DD"
  );
  return m.format(format);
}

/**
 * Get Persian date string from Date object
 */
export function toPersianDate(date: Date): string {
  return moment(date).format("jYYYY/jMM/jDD");
}

/**
 * Convert Persian date to JavaScript Date
 */
export function fromPersianDate(persianDate: string): Date {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  return m.toDate();
}

/**
 * Add days to Persian date
 */
export function addDays(persianDate: string, days: number): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  return m.add(days, "days").format("jYYYY/jMM/jDD");
}

/**
 * Add months to Persian date
 */
export function addMonths(persianDate: string, months: number): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  return m.add(months, "jMonth").format("jYYYY/jMM/jDD");
}

/**
 * Get difference between two Persian dates in days
 */
export function diffDays(startDate: string, endDate: string): number {
  const start = moment(startDate, "jYYYY/jMM/jDD");
  const end = moment(endDate, "jYYYY/jMM/jDD");
  return end.diff(start, "days");
}

/**
 * Check if a date is weekend (Thursday or Friday in Iran)
 */
export function isWeekend(persianDate: string): boolean {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  const dayOfWeek = m.day(); // 0 = Saturday, 6 = Friday
  return dayOfWeek === 4 || dayOfWeek === 5; // Thursday or Friday
}

/**
 * Check if a date is today
 */
export function isToday(persianDate: string): boolean {
  const today = getCurrentPersianDate().formatted;
  return persianDate === today;
}

/**
 * Get the start of week for a Persian date
 */
export function getWeekStart(persianDate: string): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  const dayOfWeek = m.day(); // 0 = Saturday
  return m.subtract(dayOfWeek, "days").format("jYYYY/jMM/jDD");
}

/**
 * Get the start of month for a Persian date
 */
export function getMonthStart(persianDate: string): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  return m.startOf("jMonth").format("jYYYY/jMM/jDD");
}

/**
 * Get the start of quarter for a Persian date
 */
export function getQuarterStart(persianDate: string): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  const month = m.jMonth() + 1; // 1-based
  let quarterStartMonth: number;

  if (month <= 3) quarterStartMonth = 1;
  else if (month <= 6) quarterStartMonth = 4;
  else if (month <= 9) quarterStartMonth = 7;
  else quarterStartMonth = 10;

  return m
    .jMonth(quarterStartMonth - 1)
    .startOf("jMonth")
    .format("jYYYY/jMM/jDD");
}

/**
 * Generate timeline cells for different scales
 */
export function generateTimelineCells(
  startDate: string,
  endDate: string,
  scale: "week" | "month" | "quarter"
): TimelineCell[] {
  const cells: TimelineCell[] = [];
  const start = moment(startDate, "jYYYY/jMM/jDD");
  const end = moment(endDate, "jYYYY/jMM/jDD");

  const current = start.clone();

  while (current.isSameOrBefore(end)) {
    const dateString = current.format("jYYYY/jMM/jDD");

    let displayDate: string;
    if (scale === "week") {
      displayDate = current.format("jMM/jDD");
    } else if (scale === "month") {
      displayDate = current.format("jYYYY/jMM");
    } else {
      const quarter = Math.floor(current.jMonth() / 3) + 1;
      displayDate = `Q${quarter} ${current.format("jYYYY")}`;
    }

    cells.push({
      date: dateString,
      displayDate,
      isToday: isToday(dateString),
      isWeekend: isWeekend(dateString),
    });

    // Move to next period
    if (scale === "week") {
      current.add(1, "day");
    } else if (scale === "month") {
      current.add(1, "jMonth");
    } else {
      current.add(3, "jMonth");
    }
  }

  return cells;
}

/**
 * Get month name in Persian
 */
export function getMonthName(month: number): string {
  return PERSIAN_MONTHS[month - 1] || "";
}

/**
 * Get weekday name in Persian
 */
export function getWeekdayName(persianDate: string, short = false): string {
  const m = moment(persianDate, "jYYYY/jMM/jDD");
  const dayOfWeek = m.day(); // 0 = Saturday
  return short
    ? PERSIAN_WEEKDAYS_SHORT[dayOfWeek]
    : PERSIAN_WEEKDAYS[dayOfWeek];
}

/**
 * Calculate task position and width for timeline
 */
export function calculateTaskPosition(
  taskStartDate: string,
  taskEndDate: string,
  timelineStartDate: string,
  timelineEndDate: string,
  totalWidth: number
): { left: number; width: number } {
  const totalDays = diffDays(timelineStartDate, timelineEndDate);
  const taskStartOffset = diffDays(timelineStartDate, taskStartDate);
  const taskDuration = diffDays(taskStartDate, taskEndDate);

  const left = (taskStartOffset / totalDays) * totalWidth;
  const width = Math.max((taskDuration / totalDays) * totalWidth, 20); // Minimum 20px width

  return { left: Math.max(0, left), width };
}

/**
 * Get Persian date display format based on scale
 */
export function getDateDisplayFormat(
  scale: "week" | "month" | "quarter"
): string {
  switch (scale) {
    case "week":
      return "jDD jMMMM";
    case "month":
      return "jMMMM jYYYY";
    case "quarter":
      return "jYYYY";
    default:
      return "jYYYY/jMM/jDD";
  }
}

/**
 * Validate Persian date format
 */
export function isValidPersianDate(dateString: string): boolean {
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const m = moment(dateString, "jYYYY/jMM/jDD", true);
  return m.isValid();
}

/**
 * Get working days between two dates
 */
export function getWorkingDays(
  startDate: string,
  endDate: string,
  workingDays: number[] = [1, 2, 3, 4, 5] // Monday to Friday
): number {
  let workingDaysCount = 0;
  const start = moment(startDate, "jYYYY/jMM/jDD");
  const end = moment(endDate, "jYYYY/jMM/jDD");

  const current = start.clone();
  while (current.isSameOrBefore(end)) {
    const dayOfWeek = (current.day() + 1) % 7; // Convert to Monday = 1, Sunday = 0
    if (workingDays.includes(dayOfWeek)) {
      workingDaysCount++;
    }
    current.add(1, "day");
  }

  return workingDaysCount;
}
