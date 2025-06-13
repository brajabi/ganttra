"use client";

import { GanttTask, GanttConfig } from "@/lib/types";
import {
  calculateTaskPosition,
  getTaskColor,
  formatJalaliDate,
} from "@/lib/gantt-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttTaskBarProps {
  task: GanttTask;
  config: GanttConfig;
  index: number;
}

export default function GanttTaskBar({
  task,
  config,
  index,
}: GanttTaskBarProps) {
  const position = calculateTaskPosition(task, config);
  const taskColor = getTaskColor(task);

  return (
    <div
      className="absolute flex items-center"
      style={{
        right: `${position.left}px`,
        width: `${position.width}px`,
        top: `${index * config.rowHeight + 8}px`,
        height: `${config.rowHeight - 16}px`,
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="relative w-full h-full rounded-lg shadow-md border border-opacity-30 cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
              style={{
                backgroundColor: taskColor,
                borderColor: taskColor,
              }}
            >
              {/* Task Progress Bar */}
              {task.progress !== undefined && (
                <div
                  className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"
                  style={{
                    width: `${task.progress}%`,
                  }}
                />
              )}

              {/* Task Title */}
              <div className="absolute inset-0 flex items-center justify-center px-2">
                <span
                  className="text-white text-sm font-medium truncate text-center"
                  style={{ direction: "rtl" }}
                >
                  {task.title}
                </span>
              </div>

              {/* Corner indicators for start and end */}
              <div className="absolute right-0 top-0 w-2 h-2 bg-white bg-opacity-40 rounded-bl-lg" />
              <div className="absolute left-0 bottom-0 w-2 h-2 bg-white bg-opacity-40 rounded-tr-lg" />
            </div>
          </TooltipTrigger>

          <TooltipContent side="top" className="max-w-xs">
            <div className="text-center" style={{ direction: "rtl" }}>
              <p className="font-semibold mb-1">{task.title}</p>
              <p className="text-sm text-muted-foreground">
                شروع: {formatJalaliDate(task.startDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                پایان: {formatJalaliDate(task.endDate)}
              </p>
              {task.progress !== undefined && (
                <p className="text-sm text-muted-foreground mt-1">
                  پیشرفت: {task.progress}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
