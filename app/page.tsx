"use client";

import Gantt from "@/components/Gantt";
import { GanttTask } from "@/lib/types";
import jMoment from "jalali-moment";

// Configure jalali-moment
jMoment.locale("fa");

// Sample tasks with Jalali dates
const sampleTasks: GanttTask[] = [
  {
    id: "1",
    title: "طراحی رابط کاربری",
    startDate: jMoment().subtract(5, "days").toDate(),
    endDate: jMoment().add(2, "days").toDate(),
    progress: 75,
    color: "#3b82f6",
  },
  {
    id: "2",
    title: "توسعه بک‌اند",
    startDate: jMoment().subtract(2, "days").toDate(),
    endDate: jMoment().add(8, "days").toDate(),
    progress: 45,
    color: "#10b981",
  },
  {
    id: "3",
    title: "تست و رفع اشکال",
    startDate: jMoment().add(3, "days").toDate(),
    endDate: jMoment().add(12, "days").toDate(),
    progress: 10,
    color: "#f59e0b",
  },
  {
    id: "4",
    title: "مستندسازی پروژه",
    startDate: jMoment().add(1, "days").toDate(),
    endDate: jMoment().add(6, "days").toDate(),
    progress: 30,
    color: "#8b5cf6",
  },
  {
    id: "5",
    title: "استقرار نهایی",
    startDate: jMoment().add(10, "days").toDate(),
    endDate: jMoment().add(15, "days").toDate(),
    progress: 0,
    color: "#ef4444",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ direction: "rtl" }}>
      <Gantt tasks={sampleTasks} className="shadow-lg" />
    </div>
  );
}
