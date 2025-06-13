import { Project, GanttTask } from "./types";

const DB_NAME = "GanttDB";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const TASKS_STORE = "tasks";

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, {
            keyPath: "id",
          });
          projectStore.createIndex("name", "name", { unique: false });
          projectStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create tasks store
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const taskStore = db.createObjectStore(TASKS_STORE, {
            keyPath: "id",
          });
          taskStore.createIndex("projectId", "projectId", { unique: false });
          taskStore.createIndex("title", "title", { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call initDB() first.");
    }
    return this.db;
  }

  // Project operations
  async addProject(project: Project): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readwrite");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.add(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateProject(
    project: Partial<Project> & { id: string }
  ): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readwrite");
      const store = transaction.objectStore(PROJECTS_STORE);

      const getRequest = store.get(project.id);
      getRequest.onsuccess = () => {
        const existingProject = getRequest.result;
        if (existingProject) {
          const updatedProject = {
            ...existingProject,
            ...project,
            updatedAt: new Date(),
          };
          const putRequest = store.put(updatedProject);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error("Project not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [PROJECTS_STORE, TASKS_STORE],
        "readwrite"
      );

      // Delete project
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      projectStore.delete(id);

      // Delete all tasks for this project
      const taskStore = transaction.objectStore(TASKS_STORE);
      const index = taskStore.index("projectId");
      const request = index.openCursor(IDBKeyRange.only(id));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProject(id: string): Promise<Project | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Task operations
  async addTask(task: GanttTask): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASKS_STORE], "readwrite");
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.add(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateTask(task: Partial<GanttTask> & { id: string }): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASKS_STORE], "readwrite");
      const store = transaction.objectStore(TASKS_STORE);

      const getRequest = store.get(task.id);
      getRequest.onsuccess = () => {
        const existingTask = getRequest.result;
        if (existingTask) {
          const updatedTask = { ...existingTask, ...task };
          const putRequest = store.put(updatedTask);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error("Task not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteTask(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASKS_STORE], "readwrite");
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTasksByProject(projectId: string): Promise<GanttTask[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASKS_STORE], "readonly");
      const store = transaction.objectStore(TASKS_STORE);
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getTask(id: string): Promise<GanttTask | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASKS_STORE], "readonly");
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
}

export const dbManager = new IndexedDBManager();

// Utility functions
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateRandomColor = (): string => {
  const colors = [
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
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
