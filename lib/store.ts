import { create } from "zustand";
import { Project, GanttTask, TaskGroup } from "./types";
import { dbManager, generateId, generateRandomColor } from "./indexeddb";

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  tasks: GanttTask[];
  groups: TaskGroup[];
  isLoading: boolean;
  error: string | null;
  isDBInitialized: boolean;

  // Actions
  initializeDB: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  loadTasksForProject: (projectId: string) => Promise<void>;
  loadGroupsForProject: (projectId: string) => Promise<void>;
  createTask: (
    projectId: string,
    title: string,
    startDate: Date,
    endDate: Date,
    groupId?: string
  ) => Promise<GanttTask>;
  updateTask: (id: string, updates: Partial<GanttTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createGroup: (projectId: string, title: string) => Promise<TaskGroup>;
  updateGroup: (id: string, updates: Partial<TaskGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  importProjectData: (projectData: {
    project: Project;
    tasks: GanttTask[];
    groups: TaskGroup[];
  }) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  groups: [],
  isLoading: false,
  error: null,
  isDBInitialized: false,

  initializeDB: async () => {
    // Prevent multiple initialization calls
    if (get().isDBInitialized) {
      console.log("Database already initialized, skipping...");
      return;
    }

    try {
      console.log("Starting database initialization...");
      set({ isLoading: true, error: null });

      console.log("Initializing IndexedDB...");
      await dbManager.initDB();

      console.log("Checking database schema...");
      await dbManager.checkAndRepairDB();

      console.log("Loading projects...");
      await get().loadProjects();

      console.log("Database initialization complete");
      set({ isDBInitialized: true });
    } catch (error) {
      console.error("Failed to initialize database:", error);
      set({
        error: "Failed to initialize database: " + (error as Error).message,
      });
      // Still set as initialized to prevent retries
      set({ isDBInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  resetDatabase: async () => {
    try {
      set({ isLoading: true, error: null });
      await dbManager.resetDB();
      set({ projects: [], currentProject: null, tasks: [], groups: [] });
    } catch (error) {
      console.error("Failed to reset database:", error);
      set({ error: "Failed to reset database" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await dbManager.getAllProjects();
      set({ projects });
    } catch (error) {
      console.error("Failed to load projects:", error);
      set({ error: "Failed to load projects" });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (name: string, description?: string) => {
    try {
      set({ isLoading: true, error: null });
      const project: Project = {
        id: generateId(),
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbManager.addProject(project);
      set((state) => ({
        projects: [...state.projects, project],
      }));
      return project;
    } catch (error) {
      console.error("Failed to create project:", error);
      set({ error: "Failed to create project" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    try {
      set({ isLoading: true, error: null });
      await dbManager.updateProject({ id, ...updates });

      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        ),
        currentProject:
          state.currentProject && state.currentProject.id === id
            ? { ...state.currentProject, ...updates, updatedAt: new Date() }
            : state.currentProject,
      }));
    } catch (error) {
      console.error("Failed to update project:", error);
      set({ error: "Failed to update project" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await dbManager.deleteProject(id);

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject && state.currentProject.id === id
            ? null
            : state.currentProject,
        tasks:
          state.currentProject && state.currentProject.id === id
            ? []
            : state.tasks,
        groups:
          state.currentProject && state.currentProject.id === id
            ? []
            : state.groups,
      }));
    } catch (error) {
      console.error("Failed to delete project:", error);
      set({ error: "Failed to delete project" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentProject: (project: Project | null) => {
    const currentProject = get().currentProject;

    if (!currentProject && !project) return;
    if (currentProject && project && currentProject.id === project.id) return;

    set({ currentProject: project });

    if (project) {
      get().loadTasksForProject(project.id);
      get().loadGroupsForProject(project.id);
    } else {
      set({ tasks: [], groups: [] });
    }
  },

  loadTasksForProject: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await dbManager.getTasksByProject(projectId);
      const parsedTasks = tasks.map((task) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
      }));
      set({ tasks: parsedTasks });
    } catch (error) {
      console.error("Failed to load tasks:", error);
      set({ error: "Failed to load tasks" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadGroupsForProject: async (projectId: string) => {
    try {
      const groups = await dbManager.getGroupsByProject(projectId);
      const parsedGroups = groups.map((group) => ({
        ...group,
        createdAt: new Date(group.createdAt),
      }));
      set({ groups: parsedGroups });
    } catch (error) {
      console.error("Failed to load groups:", error);
      set({ error: "Failed to load groups" });
    }
  },

  createTask: async (
    projectId: string,
    title: string,
    startDate: Date,
    endDate: Date,
    groupId?: string
  ) => {
    try {
      set({ isLoading: true, error: null });
      const task: GanttTask = {
        id: generateId(),
        title,
        startDate,
        endDate,
        progress: 0,
        color: generateRandomColor(),
        projectId,
        groupId,
      };

      await dbManager.addTask(task);
      set((state) => ({
        tasks: [...state.tasks, task],
      }));
      return task;
    } catch (error) {
      console.error("Failed to create task:", error);
      set({ error: "Failed to create task" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (id: string, updates: Partial<GanttTask>) => {
    try {
      await dbManager.updateTask({ id, ...updates });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    } catch (error) {
      console.error("Failed to update task:", error);
      set({ error: "Failed to update task" });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await dbManager.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ error: "Failed to delete task" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (projectId: string, title: string) => {
    try {
      set({ isLoading: true, error: null });
      const group: TaskGroup = {
        id: generateId(),
        title,
        projectId,
        color: generateRandomColor(),
        isExpanded: true,
        createdAt: new Date(),
      };

      await dbManager.addGroup(group);
      set((state) => ({
        groups: [...state.groups, group],
      }));
      return group;
    } catch (error) {
      console.error("Failed to create group:", error);
      set({ error: "Failed to create group" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateGroup: async (id: string, updates: Partial<TaskGroup>) => {
    try {
      await dbManager.updateGroup({ id, ...updates });
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      }));
    } catch (error) {
      console.error("Failed to update group:", error);
      set({ error: "Failed to update group" });
      throw error;
    }
  },

  deleteGroup: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await dbManager.deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        // Also remove groupId from tasks that belonged to this group
        tasks: state.tasks.map((t) =>
          t.groupId === id ? { ...t, groupId: undefined } : t
        ),
      }));
    } catch (error) {
      console.error("Failed to delete group:", error);
      set({ error: "Failed to delete group" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  importProjectData: async (projectData: {
    project: Project;
    tasks: GanttTask[];
    groups: TaskGroup[];
  }) => {
    try {
      set({ isLoading: true, error: null });

      // Import project
      await dbManager.addProject(projectData.project);

      // Import groups first (since tasks may reference them)
      for (const group of projectData.groups) {
        await dbManager.addGroup(group);
      }

      // Import tasks
      for (const task of projectData.tasks) {
        await dbManager.addTask(task);
      }

      // Refresh the projects list
      await get().loadProjects();

      // Set the imported project as current
      get().setCurrentProject(projectData.project);
    } catch (error) {
      console.error("Failed to import project data:", error);
      set({ error: "خطا در وارد کردن داده‌ها" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
