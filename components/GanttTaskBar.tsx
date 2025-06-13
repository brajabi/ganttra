"use client";

import { useState, useRef, useCallback } from "react";
import { GanttTask, GanttConfig } from "@/lib/types";
import {
  calculateTaskPosition,
  getTaskColor,
  generateTimelineDates,
} from "@/lib/gantt-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import jMoment from "jalali-moment";

interface GanttTaskBarProps {
  task: GanttTask;
  config: GanttConfig;
  index: number;
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
}

export default function GanttTaskBar({
  task,
  config,
  index,
  onTaskUpdate,
  onTaskDoubleClick,
}: GanttTaskBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [dragStart, setDragStart] = useState({
    x: 0,
    startDate: task.startDate,
    endDate: task.endDate,
  });
  const taskBarRef = useRef<HTMLDivElement>(null);

  const position = calculateTaskPosition(task, config);
  const taskColor = getTaskColor(task);

  const getDateFromPosition = useCallback(
    (x: number) => {
      const timelineDates = generateTimelineDates(
        config.startDate,
        config.endDate,
        config.view
      );
      const cellIndex = Math.round(x / config.cellWidth);
      const clampedIndex = Math.max(
        0,
        Math.min(cellIndex, timelineDates.length - 1)
      );
      return timelineDates[clampedIndex];
    },
    [config]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "drag" | "resize-left" | "resize-right") => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;

      setDragStart({
        x: startX,
        startDate: task.startDate,
        endDate: task.endDate,
      });

      if (type === "drag") {
        setIsDragging(true);
      } else if (type === "resize-left") {
        setIsResizing("left");
      } else if (type === "resize-right") {
        setIsResizing("right");
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStart.x;
        const newPosition = position.left - deltaX; // Note: RTL, so we invert

        if (type === "drag") {
          // Calculate new dates for dragging
          const newStartDate = getDateFromPosition(newPosition);
          const taskDuration = jMoment(task.endDate).diff(
            jMoment(task.startDate),
            "days"
          );
          const newEndDate = jMoment(newStartDate)
            .add(taskDuration, "days")
            .toDate();

          if (onTaskUpdate) {
            onTaskUpdate(task.id, {
              startDate: newStartDate,
              endDate: newEndDate,
            });
          }
        } else if (type === "resize-left" && isResizing === "left") {
          // Resize from left (change start date)
          const newStartDate = getDateFromPosition(newPosition);
          if (jMoment(newStartDate).isBefore(jMoment(task.endDate))) {
            if (onTaskUpdate) {
              onTaskUpdate(task.id, { startDate: newStartDate });
            }
          }
        } else if (type === "resize-right" && isResizing === "right") {
          // Resize from right (change end date)
          const newEndDate = getDateFromPosition(newPosition + position.width);
          if (jMoment(newEndDate).isAfter(jMoment(task.startDate))) {
            if (onTaskUpdate) {
              onTaskUpdate(task.id, { endDate: newEndDate });
            }
          }
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [task, position, dragStart.x, getDateFromPosition, onTaskUpdate, isResizing]
  );

  return (
    <div
      ref={taskBarRef}
      className={`absolute flex items-center ${
        isDragging || isResizing ? "z-20" : "z-10"
      }`}
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
              className={`relative w-full h-full rounded-lg shadow-md border border-opacity-30 hover:shadow-lg transition-all duration-200 overflow-hidden group ${
                isDragging || isResizing
                  ? "shadow-xl ring-2 ring-blue-500"
                  : "cursor-move"
              }`}
              style={{
                backgroundColor: taskColor,
                borderColor: taskColor,
              }}
              onMouseDown={(e) => handleMouseDown(e, "drag")}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTaskDoubleClick?.(task);
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

              {/* Resize handles */}
              <div
                className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity"
                onMouseDown={(e) => handleMouseDown(e, "resize-left")}
                title="تغییر تاریخ شروع"
              />
              <div
                className="absolute left-0 top-0 w-2 h-full cursor-w-resize opacity-0 group-hover:opacity-100 bg-white bg-opacity-30 transition-opacity"
                onMouseDown={(e) => handleMouseDown(e, "resize-right")}
                title="تغییر تاریخ پایان"
              />

              {/* Corner indicators for start and end */}
              <div className="absolute right-0 top-0 w-2 h-2 bg-white bg-opacity-40 rounded-bl-lg" />
              <div className="absolute left-0 bottom-0 w-2 h-2 bg-white bg-opacity-40 rounded-tr-lg" />
            </div>
          </TooltipTrigger>

          <TooltipContent side="top" className="max-w-xs">
            <div className="text-center" style={{ direction: "rtl" }}>
              <p className="font-semibold mb-1">{task.title}</p>
              {/* <p className="text-sm text-muted-foreground">
                شروع: {formatJalaliDate(task.startDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                پایان: {formatJalaliDate(task.endDate)}
              </p> */}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
