"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderOpen, Calendar, Trash2, Upload } from "lucide-react";
import { formatJalaliDate } from "@/lib/gantt-utils";
import { parseImportedJSON } from "@/lib/export-utils";

export default function Home() {
  const router = useRouter();
  const {
    projects,
    isLoading,
    error,
    isDBInitialized,
    initializeDB,
    resetDatabase,
    createProject,
    deleteProject,
    importProjectData,
  } = useAppStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = parseImportedJSON(content);
        await importProjectData(importedData);
        alert("پروژه با موفقیت وارد شد");
        router.push(`/project/${importedData.project.id}`);
      } catch (error) {
        console.error("Import failed:", error);
        alert("خطا در وارد کردن داده‌ها: " + (error as Error).message);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  useEffect(() => {
    // Initialize database only once
    if (!isDBInitialized) {
      console.log("Initializing database from Home component...");
      initializeDB();
    }
  }, [isDBInitialized, initializeDB]);

  const handleResetDatabase = async () => {
    if (
      confirm(
        "آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است."
      )
    ) {
      try {
        await resetDatabase();
        window.location.reload();
      } catch (error) {
        console.error("Reset failed:", error);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    try {
      const project = await createProject(projectName, projectDescription);
      setIsCreateDialogOpen(false);
      setProjectName("");
      setProjectDescription("");
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("آیا از حذف این پروژه اطمینان دارید؟")) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  // Show loading only during initial database setup
  if (!isDBInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال راه‌اندازی...</p>
          <p className="mt-2 text-xs text-gray-500">
            در صورت طولانی شدن انتظار، صفحه را رفرش کنید
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            رفرش صفحه
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ direction: "rtl" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مدیریت پروژه‌ها
          </h1>
          <p className="text-gray-600">
            پروژه‌های خود را مدیریت کنید و نمودار گانت آن‌ها را مشاهده کنید
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                تلاش مجدد
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDatabase}
                className="text-red-600 hover:text-red-700"
              >
                پاک کردن داده‌ها
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                ایجاد پروژه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" style={{ direction: "rtl" }}>
              <DialogHeader>
                <DialogTitle>ایجاد پروژه جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    نام پروژه
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="نام پروژه را وارد کنید"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    توضیحات (اختیاری)
                  </label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="توضیحات پروژه"
                    className="w-full"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                  >
                    ایجاد پروژه
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {projects.length > 0 && (
            <Select onValueChange={handleProjectSelect}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="انتخاب پروژه موجود" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="sr-only"
              id="import-project-file"
            />
            <label
              htmlFor="import-project-file"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 gap-2 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              وارد کردن پروژه
            </label>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProjectSelect(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      ایجاد شده: {formatJalaliDate(project.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                هیچ پروژه‌ای وجود ندارد
              </h3>
              <p className="text-gray-600 mb-6">
                برای شروع، اولین پروژه خود را ایجاد کنید
              </p>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    ایجاد پروژه جدید
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
