"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import GanttPrint from "@/components/GanttPrint";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { TimelineView } from "@/lib/types";
import "../../../../styles/print.css";

export default function PrintPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    projects,
    currentProject,
    tasks,
    groups,
    isLoading,
    initializeDB,
    setCurrentProject,
  } = useAppStore();

  const [view, setView] = useState<TimelineView>("daily");
  const [isReady, setIsReady] = useState(false);

  // Initialize database and set current project
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      try {
        await initializeDB();

        if (isCancelled) return;

        const project = projects.find((p) => p.id === projectId);
        if (project) {
          setCurrentProject(project);
          setIsReady(true);
        } else if (projects.length > 0) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    init();

    return () => {
      isCancelled = true;
    };
  }, [initializeDB, projectId, projects, router, setCurrentProject]);

  // Get view from URL params if provided
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = searchParams.get("view") as TimelineView;
    if (viewParam && (viewParam === "daily" || viewParam === "weekly")) {
      setView(viewParam);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push(`/project/${projectId}`);
  };

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            پروژه یافت نشد
          </h2>
          <Button onClick={handleBack}>بازگشت به صفحه اصلی</Button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            هیچ تسکی برای چاپ وجود ندارد
          </h2>
          <Button onClick={handleBack}>بازگشت به پروژه</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden during print */}
      <div className="print:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت به پروژه
            </Button>
            <div className="text-lg font-semibold text-gray-900">
              پیش‌نمایش چاپ - {currentProject.name}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">نمای:</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as TimelineView)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="daily">روزانه</option>
                <option value="weekly">هفتگی</option>
              </select>
            </div>

            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              چاپ
            </Button>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto p-4 print:p-0 print:max-w-none">
          <GanttPrint tasks={tasks} groups={groups} view={view} />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4 landscape;
          }

          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          .print:hidden {
            display: none !important;
          }

          .print:p-0 {
            padding: 0 !important;
          }

          .print:max-w-none {
            max-width: none !important;
          }
        }
      `}</style>
    </>
  );
}
