"use client";

import { useState, useMemo } from "react";
import { GanttTask, GanttConfig, TimelineView } from "@/lib/types";
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

interface GanttProps {
  tasks: GanttTask[];
  className?: string;
}

export default function Gantt({ tasks, className = "" }: GanttProps) {
  const [view, setView] = useState<TimelineView>("daily");

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

  const chartWidth = timelineDates.length * config.cellWidth;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle style={{ direction: "rtl" }}>نمودار گانت</CardTitle>

          <div className="flex items-center gap-2">
            <Select
              value={view}
              onValueChange={(value: TimelineView) => setView(value)}
            >
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
          <GanttTaskList tasks={tasks} config={config} />

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
                  {timelineDates.map((_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{
                        left: `${index * config.cellWidth}px`,
                        width: "1px",
                      }}
                    />
                  ))}

                  {tasks.map((_, index) => (
                    <div
                      key={index}
                      className="absolute left-0 right-0 border-b border-gray-100"
                      style={{
                        top: `${index * config.rowHeight}px`,
                        height: "1px",
                      }}
                    />
                  ))}
                </div>

                {/* Task Bars */}
                {tasks.map((task, index) => (
                  <GanttTaskBar
                    key={task.id}
                    task={task}
                    config={config}
                    index={index}
                  />
                ))}

                {/* Today Indicator */}
                <TodayIndicator config={config} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Today indicator component
function TodayIndicator({ config }: { config: GanttConfig }) {
  const today = new Date();
  const timelineDates = generateTimelineDates(
    config.startDate,
    config.endDate,
    config.view
  );

  // Find today's position
  const todayIndex = timelineDates.findIndex((date) => {
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    return dateStr === todayStr;
  });

  if (todayIndex === -1) return null;

  const todayPosition = todayIndex * config.cellWidth + config.cellWidth / 2;

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-10"
      style={{ left: `${todayPosition}px` }}
    >
      <div className="w-px h-full bg-red-500 opacity-70" />
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
}
