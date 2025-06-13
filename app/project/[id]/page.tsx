"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

import { Card, CardContent } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Trash2, Edit3, Printer, Users } from "lucide-react";
import Gantt from "@/components/Gantt";
import { ColorPicker } from "@/components/ColorPicker";
import jMoment from "jalali-moment";
import { GanttTask } from "@/lib/types";
import { DateTimePicker } from "@/components/DateTimePicker";

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
    groups,
    isLoading,
    error,
    initializeDB,
    setCurrentProject,
    createTask,
    deleteTask,
    updateTask,
    createGroup,
    deleteGroup,
    updateGroup,
  } = useAppStore();

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [isEditTaskSheetOpen, setIsEditTaskSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [taskColor, setTaskColor] = useState("#3b82f6");
  const [taskGroupId, setTaskGroupId] = useState<string>("none");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupColor, setGroupColor] = useState("#3b82f6");

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

      const task = await createTask(
        currentProject.id,
        taskTitle,
        startDate,
        endDate,
        taskGroupId === "none" ? undefined : taskGroupId
      );

      // Update task color if different from default
      if (taskColor !== "#3b82f6") {
        await updateTask(task.id, { color: taskColor });
      }

      setIsAddTaskDialogOpen(false);
      setTaskTitle("");
      setTaskStartDate("");
      setTaskEndDate("");
      setTaskColor("#3b82f6");
      setTaskGroupId("none");
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }, [
    taskTitle,
    taskStartDate,
    taskEndDate,
    taskColor,
    taskGroupId,
    currentProject,
    createTask,
    updateTask,
  ]);

  const handleAddGroup = useCallback(async () => {
    if (!groupTitle.trim() || !currentProject) return;

    try {
      const group = await createGroup(currentProject.id, groupTitle);

      // Update group color if different from default
      if (groupColor !== "#3b82f6") {
        await updateGroup(group.id, { color: groupColor });
      }

      setIsAddGroupDialogOpen(false);
      setGroupTitle("");
      setGroupColor("#3b82f6");
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  }, [groupTitle, groupColor, currentProject, createGroup, updateGroup]);

  const handleEditTask = useCallback(async () => {
    if (!selectedTask || !taskTitle.trim() || !taskStartDate || !taskEndDate)
      return;

    try {
      const startDate = jMoment(taskStartDate, "YYYY/MM/DD").toDate();
      const endDate = jMoment(taskEndDate, "YYYY/MM/DD").toDate();

      if (endDate < startDate) {
        alert("تاریخ پایان باید بعد از تاریخ شروع باشد");
        return;
      }

      await updateTask(selectedTask.id, {
        title: taskTitle,
        startDate,
        endDate,
        color: taskColor,
        groupId: taskGroupId === "none" ? undefined : taskGroupId,
      });
      setIsEditTaskSheetOpen(false);
      setSelectedTask(null);
      setTaskTitle("");
      setTaskStartDate("");
      setTaskEndDate("");
      setTaskColor("#3b82f6");
      setTaskGroupId("none");
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }, [
    selectedTask,
    taskTitle,
    taskStartDate,
    taskEndDate,
    taskColor,
    taskGroupId,
    updateTask,
  ]);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (confirm("آیا از حذف این تسک اطمینان دارید؟")) {
        try {
          await deleteTask(taskId);
          if (selectedTask?.id === taskId) {
            setIsEditTaskSheetOpen(false);
            setSelectedTask(null);
          }
        } catch (error) {
          console.error("Failed to delete task:", error);
        }
      }
    },
    [deleteTask, selectedTask]
  );

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      if (
        confirm(
          "آیا از حذف این گروه اطمینان دارید؟ تسک‌های داخل گروه از گروه خارج خواهند شد."
        )
      ) {
        try {
          await deleteGroup(groupId);
        } catch (error) {
          console.error("Failed to delete group:", error);
        }
      }
    },
    [deleteGroup]
  );

  const handleTaskClick = useCallback((task: GanttTask) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskStartDate(jMoment(task.startDate).format("YYYY-MM-DD"));
    setTaskEndDate(jMoment(task.endDate).format("YYYY-MM-DD"));
    setTaskColor(task.color || "#3b82f6");
    setTaskGroupId(task.groupId || "none");
    setIsEditTaskSheetOpen(true);
  }, []);

  const handleProjectChange = useCallback(
    (newProjectId: string) => {
      router.push(`/project/${newProjectId}`);
    },
    [router]
  );

  const handleBackClick = useCallback(() => {
    router.push("/");
  }, [router]);

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
    <div className="min-h-screen bg-gray-50" style={{ direction: "rtl" }}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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

              {/* Add Group Button */}
              <Dialog
                open={isAddGroupDialogOpen}
                onOpenChange={setIsAddGroupDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Users className="w-4 h-4" />
                    افزودن گروه
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-md"
                  style={{ direction: "rtl" }}
                >
                  <DialogHeader>
                    <DialogTitle>افزودن گروه جدید</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        نام گروه
                      </Label>
                      <Input
                        value={groupTitle}
                        onChange={(e) => setGroupTitle(e.target.value)}
                        placeholder="نام گروه را وارد کنید"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        رنگ گروه
                      </Label>
                      <ColorPicker
                        selectedColor={groupColor}
                        onColorChange={setGroupColor}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddGroupDialogOpen(false)}
                      >
                        انصراف
                      </Button>
                      <Button
                        onClick={handleAddGroup}
                        disabled={!groupTitle.trim()}
                      >
                        افزودن گروه
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
                      <Label className="block text-sm font-medium mb-2">
                        عنوان تسک
                      </Label>
                      <Input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="عنوان تسک را وارد کنید"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        گروه (اختیاری)
                      </Label>
                      <Select
                        value={taskGroupId}
                        onValueChange={setTaskGroupId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="انتخاب گروه" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون گروه</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                {group.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        رنگ تسک
                      </Label>
                      <ColorPicker
                        selectedColor={taskColor}
                        onColorChange={setTaskColor}
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        تاریخ شروع
                      </Label>
                      <DateTimePicker
                        value={taskStartDate}
                        onChange={setTaskStartDate}
                        placeholder="انتخاب تاریخ شروع"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        تاریخ پایان
                      </Label>
                      <DateTimePicker
                        value={taskEndDate}
                        onChange={setTaskEndDate}
                        placeholder="انتخاب تاریخ پایان"
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

              {/* Print Button */}
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/project/${projectId}/print?view=${
                      tasks.length > 0 ? "daily" : "weekly"
                    }`
                  )
                }
                className="gap-2"
                disabled={tasks.length === 0}
              >
                <Printer className="w-4 h-4" />
                چاپ
              </Button>
            </div>
          </div>

          {/* Groups Management */}
          {groups.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span>{group.title}</span>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Gantt Chart - Full Screen */}
        <div className="flex-1 overflow-hidden">
          {tasks.length > 0 ? (
            <Gantt
              tasks={tasks}
              groups={groups}
              onTaskDoubleClick={handleTaskClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
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
            </div>
          )}
        </div>

        {/* Task Edit Sheet */}
        <Sheet open={isEditTaskSheetOpen} onOpenChange={setIsEditTaskSheetOpen}>
          <SheetContent side="right" style={{ direction: "rtl" }}>
            <SheetHeader>
              <SheetTitle>ویرایش تسک</SheetTitle>
              <SheetDescription>
                اطلاعات تسک را ویرایش کنید یا آن را حذف کنید
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label className="block text-sm font-medium mb-2">
                  عنوان تسک
                </Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="عنوان تسک را وارد کنید"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">
                  گروه (اختیاری)
                </Label>
                <Select value={taskGroupId} onValueChange={setTaskGroupId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب گروه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون گروه</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">
                  رنگ تسک
                </Label>
                <ColorPicker
                  selectedColor={taskColor}
                  onColorChange={setTaskColor}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">
                  تاریخ شروع
                </Label>
                <DateTimePicker
                  value={taskStartDate}
                  onChange={setTaskStartDate}
                  placeholder="انتخاب تاریخ شروع"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">
                  تاریخ پایان
                </Label>
                <DateTimePicker
                  value={taskEndDate}
                  onChange={setTaskEndDate}
                  placeholder="انتخاب تاریخ پایان"
                  className="w-full"
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  variant="destructive"
                  onClick={() =>
                    selectedTask && handleDeleteTask(selectedTask.id)
                  }
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف تسک
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditTaskSheetOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleEditTask}
                    disabled={
                      !taskTitle.trim() || !taskStartDate || !taskEndDate
                    }
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    ذخیره تغییرات
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
