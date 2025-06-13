"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Settings, Trash2 } from "lucide-react";
import Gantt from "@/components/Gantt";
import jMoment from "jalali-moment";

// Configure jalali-moment
jMoment.locale("fa");

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    projects,
    currentProject,
    tasks,
    isLoading,
    error,
    initializeDB,
    setCurrentProject,
    createTask,
    deleteTask,
  } = useAppStore();

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");

  // Initialize database and set current project only once
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      try {
        await initializeDB();

        if (isCancelled) return;

        // Only set current project if it's different or not set
        if (!currentProject || currentProject.id !== projectId) {
          const project = projects.find((p) => p.id === projectId);
          if (project) {
            setCurrentProject(project);
          } else if (projects.length > 0) {
            // Project not found, redirect to home
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    init();

    return () => {
      isCancelled = true;
    };
  }, [
    currentProject,
    initializeDB,
    projectId,
    projects,
    router,
    setCurrentProject,
  ]); // Only depend on projectId to avoid infinite loops

  // Memoized handlers to prevent re-creation on every render
  const handleAddTask = useCallback(async () => {
    if (!taskTitle.trim() || !taskStartDate || !taskEndDate || !currentProject)
      return;

    try {
      const startDate = jMoment(taskStartDate, "YYYY/MM/DD").toDate();
      const endDate = jMoment(taskEndDate, "YYYY/MM/DD").toDate();

      if (endDate < startDate) {
        alert("تاریخ پایان باید بعد از تاریخ شروع باشد");
        return;
      }

      await createTask(currentProject.id, taskTitle, startDate, endDate);
      setIsAddTaskDialogOpen(false);
      setTaskTitle("");
      setTaskStartDate("");
      setTaskEndDate("");
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }, [taskTitle, taskStartDate, taskEndDate, currentProject, createTask]);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (confirm("آیا از حذف این تسک اطمینان دارید؟")) {
        try {
          await deleteTask(taskId);
        } catch (error) {
          console.error("Failed to delete task:", error);
        }
      }
    },
    [deleteTask]
  );

  const handleProjectChange = useCallback(
    (newProjectId: string) => {
      router.push(`/project/${newProjectId}`);
    },
    [router]
  );

  const handleBackClick = useCallback(() => {
    router.push("/");
  }, [router]);

  // Memoize task list to prevent unnecessary re-renders
  const taskList = useMemo(() => {
    return tasks.map((task) => (
      <div
        key={task.id}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: task.color }}
          />
          <div>
            <h4 className="font-medium">{task.title}</h4>
            <p className="text-sm text-gray-600">
              {jMoment(task.startDate).format("jYYYY/jM/jD")} -{" "}
              {jMoment(task.endDate).format("jYYYY/jM/jD")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteTask(task.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ));
  }, [tasks, handleDeleteTask]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            پروژه یافت نشد
          </h2>
          <Button onClick={handleBackClick}>بازگشت به صفحه اصلی</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ direction: "rtl" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentProject.name}
              </h1>
              {currentProject.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Project Selector */}
            <Select
              value={currentProject.id}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Task Button */}
            <Dialog
              open={isAddTaskDialogOpen}
              onOpenChange={setIsAddTaskDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  افزودن تسک
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-md"
                style={{ direction: "rtl" }}
              >
                <DialogHeader>
                  <DialogTitle>افزودن تسک جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      عنوان تسک
                    </label>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="عنوان تسک را وارد کنید"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      تاریخ شروع
                    </label>
                    <Input
                      type="date"
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      تاریخ پایان
                    </label>
                    <Input
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddTaskDialogOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      onClick={handleAddTask}
                      disabled={
                        !taskTitle.trim() || !taskStartDate || !taskEndDate
                      }
                    >
                      افزودن تسک
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tasks List */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">فهرست تسک‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">{taskList}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gantt Chart */}
        <div className="mb-6">
          <Gantt tasks={tasks} />
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                هیچ تسکی وجود ندارد
              </h3>
              <p className="text-gray-600 mb-6">
                برای شروع، اولین تسک پروژه خود را ایجاد کنید
              </p>
              <Dialog
                open={isAddTaskDialogOpen}
                onOpenChange={setIsAddTaskDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    افزودن تسک جدید
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
