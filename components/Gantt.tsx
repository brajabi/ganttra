"use client";

import React, { useState, useMemo, useCallback } from "react";
import { GanttTask, GanttConfig, TimelineView, TaskGroup } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  calculateGanttDimensions,
  generateTimelineDates,
  formatJalaliDate,
  toPersianNumbers,
} from "@/lib/gantt-utils";
import GanttTimeline from "./GanttTimeline";
import GanttTaskBar from "./GanttTaskBar";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Calendar } from "lucide-react";
import jMoment from "jalali-moment";

interface GanttProps {
  tasks: GanttTask[];
  groups?: TaskGroup[];
  className?: string;
  onTaskClick?: (task: GanttTask) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
}

// Interface for organized data structure
interface GanttRow {
  type: "group" | "task";
  id: string;
  data: TaskGroup | GanttTask;
  index: number; // Position in the visual list
}

const Gantt = React.memo(function Gantt({
  tasks,
  groups = [],
  className = "",
  onTaskClick,
  onTaskDoubleClick,
}: GanttProps) {
  const [view, setView] = useState<TimelineView>("daily");
  const { updateTask } = useAppStore();

  // Refs for scroll synchronization
  const taskListScrollRef = React.useRef<HTMLDivElement>(null);
  const chartScrollRef = React.useRef<HTMLDivElement>(null);

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

  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: Partial<GanttTask>) => {
      try {
        await updateTask(taskId, updates);
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [updateTask]
  );

  const handleViewChange = useCallback((value: TimelineView) => {
    setView(value);
  }, []);

  // Scroll synchronization handlers
  const handleTaskListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollTop = e.currentTarget.scrollTop;
      }
    },
    []
  );

  const handleChartScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (taskListScrollRef.current) {
      taskListScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  // Render task bars and group headers
  const rowElements = useMemo(() => {
    return organizedRows.map((row) => {
      if (row.type === "group") {
        const group = row.data as TaskGroup;
        return (
          <div
            key={`group-${group.id}`}
            className="absolute left-0 right-0 flex items-center bg-gray-100 border-b border-gray-300 px-4"
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
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: group.color || "#6b7280" }}
              />
              <span className="font-semibold text-gray-800">{group.title}</span>
            </div>
          </div>
        );
      } else {
        const task = row.data as GanttTask;
        return (
          <GanttTaskBar
            key={`task-${task.id}`}
            task={task}
            config={config}
            index={row.index}
            onTaskUpdate={handleTaskUpdate}
            onTaskDoubleClick={onTaskDoubleClick}
          />
        );
      }
    });
  }, [organizedRows, config, handleTaskUpdate, onTaskDoubleClick]);

  // Memoize grid lines for all rows
  const verticalGridLines = useMemo(
    () =>
      timelineDates.map((_, index) => (
        <div
          key={index}
          className="absolute top-0 bottom-0 border-l border-gray-100"
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
          className="absolute left-0 right-0 border-b border-gray-100"
          style={{
            top: `${index * config.rowHeight}px`,
            height: "1px",
          }}
        />
      )),
    [organizedRows, config.rowHeight]
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle style={{ direction: "rtl" }}>نمودار گانت</CardTitle>

          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={handleViewChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    روزانه
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    هفتگی
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex border border-gray-200 max-h-[600px] overflow-hidden">
          {/* Task List */}
          <div className="flex flex-col">
            <div
              className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-4"
              style={{ height: "53px" }}
            >
              <h3
                className="font-semibold text-gray-900 text-right"
                style={{ direction: "rtl" }}
              >
                فهرست وظایف
              </h3>
            </div>
            <div
              ref={taskListScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
              onScroll={handleTaskListScroll}
              style={{ width: "300px" }}
            >
              <div className="divide-y divide-gray-100">
                {organizedRows.map((row) => {
                  if (row.type === "group") {
                    const group = row.data as TaskGroup;
                    return (
                      <div
                        key={`group-${group.id}`}
                        className="bg-gray-100 border-b border-gray-300"
                        style={{ height: `${config.rowHeight}px` }}
                      >
                        <div
                          className="flex items-center h-full px-4"
                          style={{ direction: "rtl" }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: group.color || "#6b7280",
                              }}
                            />
                            <span className="font-semibold text-gray-800">
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
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ height: `${config.rowHeight}px` }}
                        onClick={() => onTaskClick?.(task)}
                        onDoubleClick={() => onTaskDoubleClick?.(task)}
                      >
                        <div
                          className="flex items-center justify-between h-full"
                          style={{ direction: "rtl" }}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate text-right hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 justify-end">
                              <span>
                                {formatJalaliDate(task.startDate, "jMM/jDD")}
                              </span>
                              <span>تا</span>
                              <span>
                                {formatJalaliDate(task.endDate, "jMM/jDD")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mr-3">
                            {task.progress !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {toPersianNumbers(task.progress.toString())}%
                              </Badge>
                            )}

                            <div
                              className="w-3 h-3 rounded-full border border-white shadow-sm"
                              style={{
                                backgroundColor: task.color || "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline Header - Fixed */}
            <div className="flex-shrink-0 overflow-x-auto">
              <div style={{ width: `${chartWidth}px` }}>
                <GanttTimeline config={config} />
              </div>
            </div>

            {/* Chart Body - Scrollable */}
            <div
              ref={chartScrollRef}
              className="flex-1 overflow-auto"
              onScroll={handleChartScroll}
            >
              <div className="relative" style={{ width: `${chartWidth}px` }}>
                {/* Task Chart */}
                <div
                  className="relative bg-white"
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
                  <TodayIndicator config={config} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Today indicator component - memoized
const TodayIndicator = React.memo(function TodayIndicator({
  config,
}: {
  config: GanttConfig;
}) {
  const todayPosition = useMemo(() => {
    const timelineDates = generateTimelineDates(
      config.startDate,
      config.endDate,
      config.view
    );
    const today = new Date();

    if (config.view === "daily") {
      // Find today's position in daily view
      const todayIndex = timelineDates.findIndex((date) =>
        jMoment(date).isSame(jMoment(today), "day")
      );

      if (todayIndex === -1) return null;

      return {
        right: `${todayIndex * config.cellWidth + config.cellWidth / 2}px`,
      };
    } else {
      // Weekly view - find which week contains today and position within that week
      const todayMoment = jMoment(today);
      const weekIndex = timelineDates.findIndex((date) =>
        todayMoment.isSame(jMoment(date), "week")
      );

      if (weekIndex === -1) return null;

      // Calculate day within the week (0 = start of week, 6 = end of week)
      const weekStart = jMoment(timelineDates[weekIndex]).startOf("week");
      const dayInWeek = todayMoment.diff(weekStart, "days");
      const dayPosition = (dayInWeek / 7) * config.cellWidth;

      return {
        right: `${weekIndex * config.cellWidth + dayPosition}px`,
      };
    }
  }, [config]);

  if (!todayPosition) return null;

  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={todayPosition}
    >
      <div className="relative h-full">
        <div className="absolute top-0 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2" />
        <div className="w-px h-full bg-red-500 opacity-70" />
      </div>
    </div>
  );
});

export default Gantt;
