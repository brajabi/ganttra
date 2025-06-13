"use client";

import React, { useState, useMemo, useCallback } from "react";
import { GanttTask, GanttConfig, TimelineView } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  calculateGanttDimensions,
  generateTimelineDates,
} from "@/lib/gantt-utils";
import GanttTimeline from "./GanttTimeline";
import GanttTaskList from "./GanttTaskList";
import GanttTaskBar from "./GanttTaskBar";

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
  className?: string;
  onTaskClick?: (task: GanttTask) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
}

const Gantt = React.memo(function Gantt({
  tasks,
  className = "",
  onTaskClick,
  onTaskDoubleClick,
}: GanttProps) {
  const [view, setView] = useState<TimelineView>("daily");
  const { updateTask } = useAppStore();

  const config: GanttConfig = useMemo(() => {
    const dimensions = calculateGanttDimensions(tasks, view);
    return {
      view,
      ...dimensions,
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

  // Memoize task bars to prevent re-creation
  const taskBars = useMemo(
    () =>
      tasks.map((task, index) => (
        <GanttTaskBar
          key={task.id}
          task={task}
          config={config}
          index={index}
          onTaskUpdate={handleTaskUpdate}
          onTaskDoubleClick={onTaskDoubleClick}
        />
      )),
    [tasks, config, handleTaskUpdate, onTaskDoubleClick]
  );

  // Memoize grid lines
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
      tasks.map((_, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 border-b border-gray-100"
          style={{
            top: `${index * config.rowHeight}px`,
            height: "1px",
          }}
        />
      )),
    [tasks, config.rowHeight]
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
        <div className="flex overflow-hidden border border-gray-200">
          {/* Task List */}
          <GanttTaskList
            tasks={tasks}
            config={config}
            onTaskClick={onTaskClick}
            onTaskDoubleClick={onTaskDoubleClick}
          />

          {/* Chart Area */}
          <div className="flex-1 overflow-x-auto">
            <div className="relative" style={{ width: `${chartWidth}px` }}>
              {/* Timeline Header */}
              <GanttTimeline config={config} />

              {/* Task Chart */}
              <div
                className="relative bg-white"
                style={{
                  height: `${tasks.length * config.rowHeight}px`,
                  minHeight: "200px",
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
                <TodayIndicator config={config} />
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
    const today = new Date();
    const timelineDates = generateTimelineDates(
      config.startDate,
      config.endDate,
      config.view
    );

    let todayIndex = -1;
    let position = 0;

    if (config.view === "daily") {
      // Find today's position in daily view using jalali-moment for consistent comparison
      todayIndex = timelineDates.findIndex((date) => {
        return jMoment(date).isSame(jMoment(today), "day");
      });

      if (todayIndex !== -1) {
        position = todayIndex * config.cellWidth + config.cellWidth / 2;
      }
    } else {
      // Weekly view - find which week contains today
      const todayWeekStart = jMoment(today).startOf("week");

      todayIndex = timelineDates.findIndex((date) => {
        const weekStart = jMoment(date).startOf("week");
        return weekStart.isSame(todayWeekStart, "week");
      });

      if (todayIndex !== -1) {
        // Calculate position within the week
        const weekStart = jMoment(timelineDates[todayIndex]).startOf("week");
        const dayInWeek = jMoment(today).diff(weekStart, "days");
        const dayWidth = config.cellWidth / 7; // Divide week width by 7 days
        position = todayIndex * config.cellWidth + dayInWeek * dayWidth;
      }
    }

    return { index: todayIndex, position };
  }, [config]);

  if (todayPosition.index === -1) return null;

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-10"
      style={{ right: `${todayPosition.position}px` }}
    >
      <div className="w-px h-full bg-red-500 opacity-70" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
});

export default Gantt;
