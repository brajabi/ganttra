"use client";

import { GanttConfig } from "@/lib/types";
import {
  generateTimelineDates,
  formatJalaliDateShort,
  formatJalaliWeek,
  getDayName,
} from "@/lib/gantt-utils";

interface GanttTimelineProps {
  config: GanttConfig;
}

export default function GanttTimeline({ config }: GanttTimelineProps) {
  const timelineDates = generateTimelineDates(
    config.startDate,
    config.endDate,
    config.view
  );

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex" style={{ direction: "rtl" }}>
        {timelineDates.map((date, index) => (
          <div
            key={index}
            className="flex-shrink-0 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            style={{ width: `${config.cellWidth}px` }}
          >
            <div className="p-2 text-center">
              {config.view === "daily" ? (
                <div className="text-xs">
                  <div className="font-semibold text-gray-900 mb-1">
                    {formatJalaliDateShort(date)}
                  </div>
                  <div className="text-gray-600">{getDayName(date)}</div>
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
  );
}
