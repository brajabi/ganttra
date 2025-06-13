import { create } from "zustand";
import { Project, GanttTask } from "./types";
import { dbManager, generateId, generateRandomColor } from "./indexeddb";

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  tasks: GanttTask[];
  isLoading: boolean;
  error: string | null;
  isDBInitialized: boolean;

  // Actions
  initializeDB: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  loadTasksForProject: (projectId: string) => Promise<void>;
  createTask: (
    projectId: string,
    title: string,
    startDate: Date,
    endDate: Date
  ) => Promise<GanttTask>;
  updateTask: (id: string, updates: Partial<GanttTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  isLoading: false,
  error: null,
  isDBInitialized: false,

  initializeDB: async () => {
    // Prevent multiple initialization calls
    if (get().isDBInitialized) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      await dbManager.initDB();
      await get().loadProjects();
      set({ isDBInitialized: true });
    } catch (error) {
      console.error("Failed to initialize database:", error);
      set({ error: "Failed to initialize database" });
      // Still set as initialized to prevent retries
      set({ isDBInitialized: true });
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
    } else {
      set({ tasks: [] });
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

  createTask: async (
    projectId: string,
    title: string,
    startDate: Date,
    endDate: Date
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

  setError: (error: string | null) => {
    set({ error });
  },
}));
