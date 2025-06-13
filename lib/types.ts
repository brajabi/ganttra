export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  color?: string;
}

export type TimelineView = "daily" | "weekly";

export interface GanttConfig {
  view: TimelineView;
  startDate: Date;
  endDate: Date;
  cellWidth: number;
  rowHeight: number;
}
