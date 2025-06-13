import jMoment from "jalali-moment";
import { Project, GanttTask, TaskGroup } from "./types";

// Configure jalali-moment
jMoment.locale("fa");

export interface SerializedTask
  extends Omit<GanttTask, "startDate" | "endDate"> {
  startDate: string;
  endDate: string;
}

export interface SerializedGroup extends Omit<TaskGroup, "createdAt"> {
  createdAt: string;
}

export interface ProjectExportData {
  project: Project;
  tasks: SerializedTask[];
  groups: SerializedGroup[];
  exportDate: string;
  version: string;
}

/**
 * Export project data as JSON
 */
export const exportProjectAsJSON = (
  project: Project,
  tasks: GanttTask[],
  groups: TaskGroup[]
): string => {
  const exportData: ProjectExportData = {
    project,
    tasks: tasks.map((task) => ({
      ...task,
      startDate: task.startDate.toISOString(),
      endDate: task.endDate.toISOString(),
    })),
    groups: groups.map((group) => ({
      ...group,
      createdAt: group.createdAt.toISOString(),
    })),
    exportDate: new Date().toISOString(),
    version: "1.0.0",
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Download JSON file
 */
export const downloadJSON = (jsonData: string, filename: string) => {
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export project data as Markdown
 */
export const exportProjectAsMarkdown = (
  project: Project,
  tasks: GanttTask[],
  groups: TaskGroup[]
): string => {
  let markdown = `# ${project.name}\n\n`;

  if (project.description) {
    markdown += `${project.description}\n\n`;
  }

  markdown += `**تاریخ ایجاد:** ${jMoment(project.createdAt).format(
    "jYYYY/jMM/jDD"
  )}\n`;
  markdown += `**آخرین بروزرسانی:** ${jMoment(project.updatedAt).format(
    "jYYYY/jMM/jDD"
  )}\n\n`;

  // Group tasks by groupId
  const tasksByGroup = tasks.reduce((acc, task) => {
    const groupId = task.groupId || "ungrouped";
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(task);
    return acc;
  }, {} as Record<string, GanttTask[]>);

  // Add grouped tasks
  groups.forEach((group) => {
    const groupTasks = tasksByGroup[group.id] || [];
    if (groupTasks.length > 0) {
      markdown += `## ${group.title}\n\n`;
      groupTasks
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .forEach((task) => {
          const startDate = jMoment(task.startDate).format("jYYYY/jMM/jDD");
          const endDate = jMoment(task.endDate).format("jYYYY/jMM/jDD");
          markdown += `- **${task.title}** (${startDate} - ${endDate})\n`;
        });
      markdown += "\n";
    }
  });

  // Add ungrouped tasks
  const ungroupedTasks = tasksByGroup["ungrouped"] || [];
  if (ungroupedTasks.length > 0) {
    markdown += `## سایر تسک‌ها\n\n`;
    ungroupedTasks
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .forEach((task) => {
        const startDate = jMoment(task.startDate).format("jYYYY/jMM/jDD");
        const endDate = jMoment(task.endDate).format("jYYYY/jMM/jDD");
        markdown += `- **${task.title}** (${startDate} - ${endDate})\n`;
      });
    markdown += "\n";
  }

  // Summary statistics
  if (tasks.length > 0) {
    const startDates = tasks.map((t) => t.startDate);
    const endDates = tasks.map((t) => t.endDate);
    const projectStart = new Date(
      Math.min(...startDates.map((d) => d.getTime()))
    );
    const projectEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    markdown += `---\n\n`;
    markdown += `### خلاصه پروژه\n\n`;
    markdown += `- **تعداد کل تسک‌ها:** ${tasks.length}\n`;
    markdown += `- **تعداد گروه‌ها:** ${groups.length}\n`;
    markdown += `- **تاریخ شروع پروژه:** ${jMoment(projectStart).format(
      "jYYYY/jMM/jDD"
    )}\n`;
    markdown += `- **تاریخ پایان پروژه:** ${jMoment(projectEnd).format(
      "jYYYY/jMM/jDD"
    )}\n`;

    const totalDays = Math.ceil(
      (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    markdown += `- **مدت زمان کل:** ${totalDays} روز\n`;
  }

  return markdown;
};

/**
 * Download Markdown file
 */
export const downloadMarkdown = (markdownData: string, filename: string) => {
  const blob = new Blob([markdownData], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse imported JSON data and convert back to runtime objects
 */
export const parseImportedJSON = (
  jsonString: string
): {
  project: Project;
  tasks: GanttTask[];
  groups: TaskGroup[];
} => {
  try {
    const data = JSON.parse(jsonString) as ProjectExportData;

    // Validate required fields
    if (!data.project || !data.tasks || !data.groups) {
      throw new Error("فرمت فایل نامعتبر است");
    }

    // Convert string dates back to Date objects
    const parsedData = {
      project: data.project,
      tasks: data.tasks.map((task) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
      })),
      groups: data.groups.map((group) => ({
        ...group,
        createdAt: new Date(group.createdAt),
      })),
    };

    return parsedData;
  } catch (error) {
    console.error("Failed to parse imported JSON:", error);
    throw new Error("خطا در پردازش فایل JSON");
  }
};

/**
 * Generate safe filename
 */
export const generateSafeFilename = (
  projectName: string,
  extension: string
): string => {
  const safeName = projectName
    .replace(/[^a-zA-Z0-9آ-ی\s-_]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
  const timestamp = jMoment().format("jYYYY-jMM-jDD");
  return `${safeName}-${timestamp}.${extension}`;
};
