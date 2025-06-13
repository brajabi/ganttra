import { Project, GanttTask, TaskGroup, TASK_COLORS } from "./types";

const DB_NAME = "GanttDB";
const DB_VERSION = 2;
const PROJECTS_STORE = "projects";
const TASKS_STORE = "tasks";
const GROUPS_STORE = "groups";

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async resetDB(): Promise<void> {
    try {
      // Close existing connection
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Delete the database
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onblocked = () => {
          console.warn(
            "Database deletion blocked. Please close all other tabs."
          );
          // Still resolve to continue
          resolve();
        };
      });

      console.log("Database reset complete");
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

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
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        if (!transaction) {
          reject(new Error("Transaction not available during upgrade"));
          return;
        }

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, {
            keyPath: "id",
          });
          projectStore.createIndex("name", "name", { unique: false });
          projectStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create or update tasks store
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const taskStore = db.createObjectStore(TASKS_STORE, {
            keyPath: "id",
          });
          taskStore.createIndex("projectId", "projectId", { unique: false });
          taskStore.createIndex("groupId", "groupId", { unique: false });
          taskStore.createIndex("title", "title", { unique: false });
        } else {
          // Upgrade existing tasks store to add groupId index if it doesn't exist
          const taskStore = transaction.objectStore(TASKS_STORE);
          if (!taskStore.indexNames.contains("groupId")) {
            taskStore.createIndex("groupId", "groupId", { unique: false });
          }
        }

        // Create groups store (new in version 2)
        if (!db.objectStoreNames.contains(GROUPS_STORE)) {
          const groupStore = db.createObjectStore(GROUPS_STORE, {
            keyPath: "id",
          });
          groupStore.createIndex("projectId", "projectId", { unique: false });
          groupStore.createIndex("title", "title", { unique: false });
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
        [PROJECTS_STORE, TASKS_STORE, GROUPS_STORE],
        "readwrite"
      );

      // Delete project
      const projectStore = transaction.objectStore(PROJECTS_STORE);
      projectStore.delete(id);

      // Delete all tasks and groups for this project
      const taskStore = transaction.objectStore(TASKS_STORE);
      const groupStore = transaction.objectStore(GROUPS_STORE);

      const taskIndex = taskStore.index("projectId");
      const taskRequest = taskIndex.openCursor(IDBKeyRange.only(id));

      taskRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      const groupIndex = groupStore.index("projectId");
      const groupRequest = groupIndex.openCursor(IDBKeyRange.only(id));

      groupRequest.onsuccess = (event) => {
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

  // Group operations
  async addGroup(group: TaskGroup): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GROUPS_STORE], "readwrite");
      const store = transaction.objectStore(GROUPS_STORE);
      const request = store.add(group);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateGroup(group: Partial<TaskGroup> & { id: string }): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GROUPS_STORE], "readwrite");
      const store = transaction.objectStore(GROUPS_STORE);

      const getRequest = store.get(group.id);
      getRequest.onsuccess = () => {
        const existingGroup = getRequest.result;
        if (existingGroup) {
          const updatedGroup = { ...existingGroup, ...group };
          const putRequest = store.put(updatedGroup);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error("Group not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteGroup(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [GROUPS_STORE, TASKS_STORE],
        "readwrite"
      );

      // Delete group
      const groupStore = transaction.objectStore(GROUPS_STORE);
      groupStore.delete(id);

      // Update tasks to remove groupId
      const taskStore = transaction.objectStore(TASKS_STORE);
      const index = taskStore.index("groupId");
      const request = index.openCursor(IDBKeyRange.only(id));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const task = cursor.value;
          const updatedTask = { ...task };
          delete updatedTask.groupId;
          cursor.update(updatedTask);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getGroupsByProject(projectId: string): Promise<TaskGroup[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GROUPS_STORE], "readonly");
      const store = transaction.objectStore(GROUPS_STORE);
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getGroup(id: string): Promise<TaskGroup | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([GROUPS_STORE], "readonly");
      const store = transaction.objectStore(GROUPS_STORE);
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
  return TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
};
