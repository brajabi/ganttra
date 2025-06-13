"use client";

import React, { useMemo } from "react";
import { GanttTask, GanttConfig, TimelineView, TaskGroup } from "@/lib/types";
import {
  calculateGanttDimensions,
  generateTimelineDates,
  calculateTaskPosition,
  getTaskColor,
  formatJalaliDate,
  formatJalaliDateShort,
  formatJalaliWeek,
} from "@/lib/gantt-utils";
import jMoment from "jalali-moment";
import "../styles/print.css";

interface GanttPrintProps {
  tasks: GanttTask[];
  groups?: TaskGroup[];
  view: TimelineView;
}

// Interface for organized data structure
interface GanttRow {
  type: "group" | "task";
  id: string;
  data: TaskGroup | GanttTask;
  index: number; // Position in the visual list
}

const GanttPrint = React.memo(function GanttPrint({
  tasks,
  groups = [],
  view,
}: GanttPrintProps) {
  // Organize tasks and groups into rows
  const organizedRows = useMemo((): GanttRow[] => {
    const rows: GanttRow[] = [];
    let index = 0;

    // Group tasks by groupId
    const tasksByGroup = tasks.reduce((acc, task) => {
      const groupId = task.groupId || "ungrouped";
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(task);
      return acc;
    }, {} as Record<string, GanttTask[]>);

    // First, add grouped tasks
    groups.forEach((group) => {
      // Add group header
      rows.push({
        type: "group",
        id: group.id,
        data: group,
        index: index++,
      });

      // Add tasks in this group
      const groupTasks = tasksByGroup[group.id] || [];
      groupTasks.forEach((task) => {
        rows.push({
          type: "task",
          id: task.id,
          data: task,
          index: index++,
        });
      });
    });

    // Then add ungrouped tasks
    const ungroupedTasks = tasksByGroup["ungrouped"] || [];
    ungroupedTasks.forEach((task) => {
      rows.push({
        type: "task",
        id: task.id,
        data: task,
        index: index++,
      });
    });

    return rows;
  }, [tasks, groups]);

  // Extract only tasks for dimension calculation
  const allTasks = useMemo(
    () =>
      organizedRows
        .filter((row) => row.type === "task")
        .map((row) => row.data as GanttTask),
    [organizedRows]
  );

  const config: GanttConfig = useMemo(() => {
    const dimensions = calculateGanttDimensions(allTasks, view);
    return {
      view,
      ...dimensions,
      cellWidth: view === "daily" ? 40 : 80, // Smaller for print
      rowHeight: 40, // Smaller for print
    };
  }, [allTasks, view]);

  const timelineDates = useMemo(
    () => generateTimelineDates(config.startDate, config.endDate, config.view),
    [config.startDate, config.endDate, config.view]
  );

  const chartWidth = useMemo(
    () => timelineDates.length * config.cellWidth,
    [timelineDates.length, config.cellWidth]
  );

  // Render task bars and group headers for print
  const rowElements = useMemo(() => {
    return organizedRows.map((row) => {
      if (row.type === "group") {
        const group = row.data as TaskGroup;
        return (
          <div
            key={`group-${group.id}`}
            className="absolute left-0 right-0 flex items-center bg-gray-200 border-b border-gray-400 px-2"
            style={{
              top: `${row.index * config.rowHeight}px`,
              height: `${config.rowHeight}px`,
              zIndex: 5,
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{ direction: "rtl" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color || "#6b7280" }}
              />
              <span className="font-semibold text-gray-800 text-xs">
                {group.title}
              </span>
            </div>
          </div>
        );
      } else {
        const task = row.data as GanttTask;
        const position = calculateTaskPosition(task, config);
        const taskColor = getTaskColor(task);

        return (
          <div
            key={`task-${task.id}`}
            className="absolute flex items-center z-10"
            style={{
              right: `${position.left}px`,
              width: `${position.width}px`,
              top: `${row.index * config.rowHeight + 4}px`,
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
      }
    });
  }, [organizedRows, config]);

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
      organizedRows.map((_, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 border-b border-gray-300 print-grid-line"
          style={{
            top: `${index * config.rowHeight}px`,
            height: "1px",
          }}
        />
      )),
    [organizedRows, config.rowHeight]
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
              {organizedRows.map((row) => {
                if (row.type === "group") {
                  const group = row.data as TaskGroup;
                  return (
                    <div
                      key={`group-${group.id}`}
                      className="bg-gray-200 border-b border-gray-400 p-2"
                      style={{ height: `${config.rowHeight}px` }}
                    >
                      <div
                        className="flex items-center h-full"
                        style={{ direction: "rtl" }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: group.color || "#6b7280",
                            }}
                          />
                          <span className="font-semibold text-gray-800 text-xs">
                            {group.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const task = row.data as GanttTask;
                  return (
                    <div
                      key={`task-${task.id}`}
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
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.color || "#3b82f6" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Chart Area */}
          <div className="print-chart-area flex-1 overflow-hidden">
            <div className="relative" style={{ width: `${chartWidth}px` }}>
              {/* Timeline Header */}
              <div
                className="bg-gray-100 border-b border-gray-400 px-2 print-timeline-header"
                style={{ height: "50px" }}
              >
                <div
                  className="flex items-center h-full"
                  style={{ direction: "rtl" }}
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {config.view === "daily" ? "نمای روزانه" : "نمای هفتگی"} -{" "}
                    {formatJalaliDate(config.startDate, "jYYYY/jMM/jDD")} تا{" "}
                    {formatJalaliDate(config.endDate, "jYYYY/jMM/jDD")}
                  </div>
                </div>
              </div>

              {/* Timeline Dates */}
              <div
                className="relative bg-white border-b border-gray-400"
                style={{ height: "30px" }}
              >
                {timelineDates.map((date, index) => (
                  <div
                    key={index}
                    className="absolute top-0 flex items-center justify-center border-l border-gray-200 text-xs font-medium text-gray-700"
                    style={{
                      left: `${index * config.cellWidth}px`,
                      width: `${config.cellWidth}px`,
                      height: "30px",
                    }}
                  >
                    {config.view === "daily"
                      ? formatJalaliDateShort(date)
                      : formatJalaliWeek(date)}
                  </div>
                ))}
              </div>

              {/* Task Chart */}
              <div
                className="relative bg-white print-chart-body"
                style={{
                  height: `${organizedRows.length * config.rowHeight}px`,
                  minHeight: "200px",
                }}
              >
                {/* Background Grid */}
                <div className="absolute inset-0">
                  {verticalGridLines}
                  {horizontalGridLines}
                </div>

                {/* Task Bars and Group Headers */}
                {rowElements}

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
