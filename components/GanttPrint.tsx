"use client";

import React, { useMemo } from "react";
import { GanttTask, GanttConfig, TimelineView } from "@/lib/types";
import {
  calculateGanttDimensions,
  generateTimelineDates,
  calculateTaskPosition,
  getTaskColor,
  formatJalaliDate,
  formatJalaliDateShort,
  formatJalaliWeek,
  getDayName,
} from "@/lib/gantt-utils";
import jMoment from "jalali-moment";
import "../styles/print.css";

interface GanttPrintProps {
  tasks: GanttTask[];
  view: TimelineView;
}

const GanttPrint = React.memo(function GanttPrint({
  tasks,
  view,
}: GanttPrintProps) {
  const config: GanttConfig = useMemo(() => {
    const dimensions = calculateGanttDimensions(tasks, view);
    return {
      view,
      ...dimensions,
      cellWidth: view === "daily" ? 40 : 80, // Smaller for print
      rowHeight: 40, // Smaller for print
    };
  }, [tasks, view]);

  const timelineDates = useMemo(
    () => generateTimelineDates(config.startDate, config.endDate, config.view),
    [config.startDate, config.endDate, config.view]
  );

  const chartWidth = useMemo(
    () => timelineDates.length * config.cellWidth,
    [timelineDates.length, config.cellWidth]
  );

  // Task bars for print
  const taskBars = useMemo(
    () =>
      tasks.map((task, index) => {
        const position = calculateTaskPosition(task, config);
        const taskColor = getTaskColor(task);

        return (
          <div
            key={task.id}
            className="absolute flex items-center z-10"
            style={{
              right: `${position.left}px`,
              width: `${position.width}px`,
              top: `${index * config.rowHeight + 4}px`,
              height: `${config.rowHeight - 8}px`,
            }}
          >
            <div
              className="relative w-full h-full rounded border border-opacity-30 overflow-hidden"
              style={{
                backgroundColor: taskColor,
                borderColor: taskColor,
              }}
            >
              {/* Task Progress Bar */}
              {task.progress !== undefined && (
                <div
                  className="absolute inset-0 bg-white bg-opacity-20 rounded"
                  style={{
                    width: `${task.progress}%`,
                  }}
                />
              )}

              {/* Task Title */}
              <div className="absolute inset-0 flex items-center justify-center px-2">
                <span
                  className="text-white text-xs font-medium truncate text-center"
                  style={{ direction: "rtl" }}
                >
                  {task.title}
                </span>
              </div>
            </div>
          </div>
        );
      }),
    [tasks, config]
  );

  // Grid lines for print
  const verticalGridLines = useMemo(
    () =>
      timelineDates.map((_, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0 border-l border-gray-300 print-grid-line"
          style={{
            left: `${index * config.cellWidth}px`,
            width: "1px",
          }}
        />
      )),
    [timelineDates, config.cellWidth]
  );

  const horizontalGridLines = useMemo(
    () =>
      tasks.map((_, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 border-b border-gray-300 print-grid-line"
          style={{
            top: `${index * config.rowHeight}px`,
            height: "1px",
          }}
        />
      )),
    [tasks, config.rowHeight]
  );

  // Today indicator for print
  const todayIndicator = useMemo(() => {
    const today = new Date();
    let todayIndex = -1;
    let position = 0;

    if (config.view === "daily") {
      todayIndex = timelineDates.findIndex((date) => {
        return jMoment(date).isSame(jMoment(today), "day");
      });

      if (todayIndex !== -1) {
        position = todayIndex * config.cellWidth + config.cellWidth / 2;
      }
    } else {
      const todayWeekStart = jMoment(today).startOf("week");

      todayIndex = timelineDates.findIndex((date) => {
        const weekStart = jMoment(date).startOf("week");
        return weekStart.isSame(todayWeekStart, "week");
      });

      if (todayIndex !== -1) {
        const weekStart = jMoment(timelineDates[todayIndex]).startOf("week");
        const dayInWeek = jMoment(today).diff(weekStart, "days");
        const dayWidth = config.cellWidth / 7;
        position = todayIndex * config.cellWidth + dayInWeek * dayWidth;
      }
    }

    if (todayIndex === -1) return null;

    return (
      <div
        className="absolute top-0 bottom-0 pointer-events-none z-20"
        style={{ right: `${position}px` }}
      >
        <div className="w-px h-full bg-red-600 print-today-line" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full print-today-dot" />
      </div>
    );
  }, [config, timelineDates]);

  return (
    <div className="print-gantt w-full bg-white" style={{ direction: "rtl" }}>
      {/* Gantt Chart Container */}
      <div className="print-gantt-container">
        <div className="flex border border-gray-400">
          {/* Task List */}
          <div
            className="print-task-list bg-gray-50 border-l border-gray-400"
            style={{ width: "250px" }}
          >
            {/* Task List Items */}
            <div>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border-b border-gray-200 p-2"
                  style={{ height: `${config.rowHeight}px` }}
                >
                  <div
                    className="flex items-center justify-between h-full"
                    style={{ direction: "rtl" }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-gray-900 truncate text-right">
                        {task.title}
                      </h4>
                      <div className="mt-1 text-xs text-gray-500 text-right">
                        {formatJalaliDate(task.startDate, "jMM/jDD")} -{" "}
                        {formatJalaliDate(task.endDate, "jMM/jDD")}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mr-2">
                      {task.progress !== undefined && (
                        <span className="text-xs text-gray-600">
                          {task.progress}%
                        </span>
                      )}
                      <div
                        className="w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: task.color || "#3b82f6" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="print-chart-area flex-1">
            <div className="relative" style={{ width: `${chartWidth}px` }}>
              {/* Timeline Header */}
              <div className="print-timeline bg-gray-100 border-b border-gray-400">
                <div className="flex" style={{ direction: "rtl" }}>
                  {timelineDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 border-l border-gray-300 bg-gray-50"
                      style={{ width: `${config.cellWidth}px` }}
                    >
                      <div className="p-1 text-center">
                        {config.view === "daily" ? (
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900">
                              {formatJalaliDateShort(date)}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {getDayName(date).substring(0, 1)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900">
                              {formatJalaliWeek(date)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Chart */}
              <div
                className="relative bg-white"
                style={{
                  height: `${tasks.length * config.rowHeight}px`,
                  minHeight: "100px",
                }}
              >
                {/* Background Grid */}
                <div className="absolute inset-0">
                  {verticalGridLines}
                  {horizontalGridLines}
                </div>

                {/* Task Bars */}
                {taskBars}

                {/* Today Indicator */}
                {todayIndicator}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GanttPrint;
