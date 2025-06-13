"use client";

import { GanttTask, GanttConfig } from "@/lib/types";
import { formatJalaliDate } from "@/lib/gantt-utils";
import { Badge } from "@/components/ui/badge";

interface GanttTaskListProps {
  tasks: GanttTask[];
  config: GanttConfig;
  onTaskClick?: (task: GanttTask) => void;
}

export default function GanttTaskList({
  tasks,
  config,
  onTaskClick,
}: GanttTaskListProps) {
  return (
    <div
      className="flex-shrink-0 bg-white border-l border-gray-200"
      style={{ width: "300px" }}
    >
      <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 p-4">
        <h3
          className="font-semibold text-gray-900 text-right"
          style={{ direction: "rtl" }}
        >
          فهرست وظایف
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ height: `${config.rowHeight}px` }}
            onClick={() => onTaskClick?.(task)}
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
                  <span>{formatJalaliDate(task.startDate, "jMM/jDD")}</span>
                  <span>تا</span>
                  <span>{formatJalaliDate(task.endDate, "jMM/jDD")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mr-3">
                {task.progress !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {task.progress}%
                  </Badge>
                )}

                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: task.color || "#3b82f6" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
