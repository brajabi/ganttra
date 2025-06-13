import jMoment from "jalali-moment";
import moment from "moment-hijri";
import { GanttTask, GanttConfig, TimelineView } from "./types";

// Configure jalali-moment to use Persian locale
jMoment.locale("fa");

export const formatJalaliDate = (
  date: Date,
  format: string = "jYYYY/jMM/jDD"
): string => {
  return jMoment(date).format(format);
};

export const formatJalaliDateShort = (date: Date): string => {
  return jMoment(date).format("jMM/jDD");
};

export const formatJalaliWeek = (date: Date): string => {
  const startOfWeek = jMoment(date).startOf("week");
  const endOfWeek = jMoment(date).endOf("week");
  return `${startOfWeek.format("jMM/jDD")} - ${endOfWeek.format("jMM/jDD")}`;
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
  return hijriMoment.format("iYYYY/iMM/iDD");
};

export const getCompleteDateInfo = (date: Date) => {
  return {
    jalali: formatJalaliDate(date, "jYYYY/jMM/jDD"),
    gregorian: formatGregorianDate(date),
    hijri: formatHijriDate(date),
    jalaliLong: jMoment(date).format("dddd، jD jMMMM jYYYY"),
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
  const startDiff = jMoment(task.startDate).diff(
    jMoment(config.startDate),
    "days"
  );
  const duration =
    jMoment(task.endDate).diff(jMoment(task.startDate), "days") + 1;

  let cellsFromStart: number;
  let taskWidthInCells: number;

  if (config.view === "daily") {
    cellsFromStart = startDiff;
    taskWidthInCells = duration;
  } else {
    // Weekly view
    cellsFromStart = Math.floor(startDiff / 7);
    taskWidthInCells = Math.ceil(duration / 7);
  }

  return {
    left: cellsFromStart * config.cellWidth,
    width: taskWidthInCells * config.cellWidth - 2, // -2 for border spacing
  };
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

  // Add some padding
  const paddedStart = jMoment(startDate).subtract(1, "week").toDate();
  const paddedEnd = jMoment(endDate).add(1, "week").toDate();

  return {
    startDate: paddedStart,
    endDate: paddedEnd,
    cellWidth: view === "daily" ? 60 : 120,
    rowHeight: 50,
  };
};
