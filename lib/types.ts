export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  color?: string;
  projectId: string;
  groupId?: string;
}

export interface TaskGroup {
  id: string;
  title: string;
  projectId: string;
  color?: string;
  isExpanded?: boolean;
  createdAt: Date;
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
  groupId?: string;
}

// Predefined color palette for tasks and groups (12 colors)
export const TASK_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f43f5e", // rose
] as const;
