export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  color?: string;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TimelineView = "daily" | "weekly";

export interface GanttConfig {
  view: TimelineView;
  startDate: Date;
  endDate: Date;
  cellWidth: number;
  rowHeight: number;
}

export interface TaskUpdatePayload {
  id: string;
  startDate?: Date;
  endDate?: Date;
  title?: string;
  progress?: number;
}
