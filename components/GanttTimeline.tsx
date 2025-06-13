"use client";

import { GanttConfig } from "@/lib/types";
import {
  generateTimelineDates,
  formatJalaliDateShort,
  formatJalaliWeek,
  getDayName,
  getCompleteDateInfo,
} from "@/lib/gantt-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        <TooltipProvider>
          {timelineDates.map((date, index) => {
            const dateInfo = getCompleteDateInfo(date);
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className="flex-shrink-0 border-l border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    style={{ width: `${config.cellWidth}px` }}
                  >
                    <div className="p-2 text-center">
                      {config.view === "daily" ? (
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900 mb-1">
                            {formatJalaliDateShort(date)}
                          </div>
                          <div className="text-gray-600">
                            {getDayName(date)}
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
                </TooltipTrigger>

                <TooltipContent side="bottom" className="max-w-xs">
                  <div
                    className="text-center space-y-2"
                    style={{ direction: "rtl" }}
                  >
                    <div className="font-semibold text-sm mb-2">
                      {dateInfo.jalaliLong}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">شمسی:</span>
                        <span className="font-mono">{dateInfo.jalali}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">میلادی:</span>
                        <span className="font-mono">{dateInfo.gregorian}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">قمری:</span>
                        <span className="font-mono">{dateInfo.hijri}</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
