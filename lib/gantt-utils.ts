import jMoment from "jalali-moment";
import moment from "moment-hijri";
import { GanttTask, GanttConfig, TimelineView } from "./types";

// Configure jalali-moment to use Persian locale
jMoment.locale("fa");

// Convert English numerals to Persian numerals
const toPersianNumbers = (str: string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
};

// Export the function
export { toPersianNumbers };

export const formatJalaliDate = (
  date: Date,
  format: string = "jYYYY/jMM/jDD"
): string => {
  return toPersianNumbers(jMoment(date).format(format));
};

export const formatJalaliDateShort = (date: Date): string => {
  return toPersianNumbers(jMoment(date).format("jMM/jDD"));
};

export const formatJalaliWeek = (date: Date): string => {
  const startOfWeek = jMoment(date).startOf("week");
  const endOfWeek = jMoment(date).endOf("week");
  return toPersianNumbers(
    `${startOfWeek.format("jMM/jDD")} - ${endOfWeek.format("jMM/jDD")}`
  );
};

export const getDayName = (date: Date): string => {
  return jMoment(date).format("dddd");
};

export const formatGregorianDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export const formatHijriDate = (date: Date): string => {
  // Using moment-hijri for accurate Hijri date conversion
  const hijriMoment = moment(date);
  return toPersianNumbers(hijriMoment.format("iYYYY/iMM/iDD"));
};

export const getCompleteDateInfo = (date: Date) => {
  return {
    jalali: formatJalaliDate(date, "jYYYY/jMM/jDD"),
    gregorian: formatGregorianDate(date),
    hijri: formatHijriDate(date),
    jalaliLong: toPersianNumbers(jMoment(date).format("dddd، jD jMMMM jYYYY")),
    gregorianLong: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
};

export const generateTimelineDates = (
  startDate: Date,
  endDate: Date,
  view: TimelineView
): Date[] => {
  const dates: Date[] = [];
  const start = jMoment(startDate);
  const end = jMoment(endDate);

  if (view === "daily") {
    const current = start.clone();
    while (current.isSameOrBefore(end, "day")) {
      dates.push(current.toDate());
      current.add(1, "day");
    }
  } else if (view === "weekly") {
    const current = start.clone().startOf("week");
    while (current.isSameOrBefore(end, "week")) {
      dates.push(current.toDate());
      current.add(1, "week");
    }
  }

  return dates;
};

export const calculateTaskPosition = (
  task: GanttTask,
  config: GanttConfig
): { left: number; width: number } => {
  if (config.view === "daily") {
    const startDiff = jMoment(task.startDate).diff(
      jMoment(config.startDate),
      "days"
    );
    const duration =
      jMoment(task.endDate).diff(jMoment(task.startDate), "days") + 1;

    return {
      left: startDiff * config.cellWidth,
      width: duration * config.cellWidth - 2, // -2 for border spacing
    };
  } else {
    // Weekly view - calculate based on weeks
    const configStartWeek = jMoment(config.startDate).startOf("week");
    const taskStartWeek = jMoment(task.startDate).startOf("week");
    const taskEndWeek = jMoment(task.endDate).startOf("week");

    const weeksFromStart = taskStartWeek.diff(configStartWeek, "weeks");
    const taskDurationInWeeks = Math.max(
      1,
      taskEndWeek.diff(taskStartWeek, "weeks") + 1
    );

    return {
      left: weeksFromStart * config.cellWidth,
      width: taskDurationInWeeks * config.cellWidth - 2, // -2 for border spacing
    };
  }
};

export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  const jDate = jMoment(date);
  return (
    jDate.isSameOrAfter(jMoment(startDate), "day") &&
    jDate.isSameOrBefore(jMoment(endDate), "day")
  );
};

export const getTaskColor = (task: GanttTask): string => {
  return task.color || "#3b82f6"; // Default blue color
};

export const calculateGanttDimensions = (
  tasks: GanttTask[],
  view: TimelineView
) => {
  if (tasks.length === 0) {
    return {
      startDate: new Date(),
      endDate: new Date(),
      cellWidth: view === "daily" ? 60 : 120,
      rowHeight: 50,
    };
  }

  const startDate = new Date(
    Math.min(...tasks.map((t) => t.startDate.getTime()))
  );
  const endDate = new Date(Math.max(...tasks.map((t) => t.endDate.getTime())));

  let paddedStart: Date;
  let paddedEnd: Date;

  if (view === "weekly") {
    // For weekly view, align to week boundaries
    paddedStart = jMoment(startDate)
      .subtract(1, "week")
      .startOf("week")
      .toDate();
    paddedEnd = jMoment(endDate).add(1, "week").endOf("week").toDate();
  } else {
    // For daily view, add some padding
    paddedStart = jMoment(startDate).subtract(1, "week").toDate();
    paddedEnd = jMoment(endDate).add(1, "week").toDate();
  }

  return {
    startDate: paddedStart,
    endDate: paddedEnd,
    cellWidth: view === "daily" ? 60 : 120,
    rowHeight: 50,
  };
};
