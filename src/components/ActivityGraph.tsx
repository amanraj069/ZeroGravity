"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityData {
  activities: { date: string; count: number }[];
  totalCompletions: number;
  maxCount: number;
  startDate: string;
  endDate: string;
}

interface MonthData {
  name: string;
  weeks: ActivityDay[][];
  startsOnSunday: boolean;
}

interface ActivityGraphProps {
  className?: string;
  joinedDate?: string;
  userId?: string; // Optional userId for viewing other users' activity
  onDateClick?: (date: string) => void;
  selectedDate?: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function ActivityGraph({
  className = "",
  joinedDate,
  userId,
  onDateClick,
  selectedDate,
}: ActivityGraphProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchActivityData = useCallback(async () => {
    setLoading(true);
    try {
      const url = userId
        ? `${
            API_ENDPOINTS.DAILY_TASKS.ACTIVITY_GRAPH
          }?userId=${encodeURIComponent(userId)}`
        : API_ENDPOINTS.DAILY_TASKS.ACTIVITY_GRAPH;
      const response = await apiCallWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivityData(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch activity data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Scroll to end on mobile when data loads
  useEffect(() => {
    if (!loading && activityData && scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        const scroll = scrollContainerRef.current;
        setTimeout(() => {
          if (!scroll) return;
          const maxScroll = scroll.scrollWidth - scroll.clientWidth;
          scroll.scrollLeft = Math.max(maxScroll, 0);
        }, 100);
      }
    }
  }, [loading, activityData]);

  // Generate months data - each month contains its weeks
  const generateMonthsData = (): MonthData[] => {
    if (!activityData) return [];

    // Create activity map for quick lookup
    const activityMap = new Map<string, number>();
    activityData.activities.forEach((a) => {
      activityMap.set(a.date, a.count);
    });

    const today = new Date();
    const months: MonthData[] = [];

    // Show the last 12 months ending at the current month
    // e.g. if today is Mar 2026, show Apr 2025 → Mar 2026
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = monthDate.getMonth();
      const monthYear = monthDate.getFullYear();

      // Get first and last day of the month
      const firstDay = new Date(monthYear, monthIndex, 1);
      const lastDay = new Date(monthYear, monthIndex + 1, 0);

      // Check if the month starts on Sunday
      const startsOnSunday = firstDay.getDay() === 0;

      const monthData: MonthData = {
        name: MONTHS[monthIndex],
        weeks: [],
        startsOnSunday,
      };

      // Start from the Sunday of the week containing the 1st
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      // End on the Saturday of the week containing the last day
      const endDate = new Date(lastDay);
      if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      }

      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const week: ActivityDay[] = [];

        for (let dayNum = 0; dayNum < 7; dayNum++) {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const day = currentDate.getDate();
          const dateStr = `${year}-${String(month + 1).padStart(
            2,
            "0",
          )}-${String(day).padStart(2, "0")}`;

          // Check if this day belongs to the current month
          const belongsToMonth = month === monthIndex && year === monthYear;
          const isFuture = currentDate > today;

          week.push({
            date: dateStr,
            count:
              !belongsToMonth || isFuture ? -1 : activityMap.get(dateStr) || 0,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        monthData.weeks.push(week);
      }

      months.push(monthData);
    }

    return months;
  };

  const months = generateMonthsData();

  // Format joined date for comparison
  const formattedJoinedDate = joinedDate
    ? new Date(joinedDate).toISOString().split("T")[0]
    : null;

  // Get color based on count - fixed levels: 0=none, 1=light, 2, 3, 4+=darkest
  const getColorClass = (count: number, maxCount: number, dateStr: string) => {
    // Check if this is the joined date - only highlight if it belongs to this month (count >= 0)
    if (formattedJoinedDate && dateStr === formattedJoinedDate && count >= 0) {
      return "bg-yellow-400 dark:bg-yellow-500";
    }

    if (count < 0) return "bg-transparent"; // Outside month or future
    if (count === 0) return "bg-gray-200 dark:bg-gray-700"; // No tasks - gray

    // Fixed levels based on task count - stronger contrast
    if (count === 1) return "bg-green-200 dark:bg-green-900"; // 1 task - lightest green
    if (count === 2) return "bg-green-400 dark:bg-green-700"; // 2 tasks
    if (count === 3) return "bg-green-600 dark:bg-green-500"; // 3 tasks
    return "bg-green-800 dark:bg-green-300"; // 4+ tasks - darkest green
  };

  const handleMouseEnter = (
    day: ActivityDay,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    // Only allow hover for days that belong to the month (count >= 0)
    if (day.count < 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Activity
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div
        className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Activity
          </h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm">
          Unable to load activity data
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-gray-200 dark:border-gray-800 p-3 md:p-4 bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {activityData.totalCompletions} contribution
          {activityData.totalCompletions !== 1 ? "s" : ""} in the last 12 months
        </h3>
        {/* Legend */}
        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] bg-gray-200 dark:bg-gray-700"></div>
          <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] bg-green-200 dark:bg-green-900"></div>
          <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] bg-green-400 dark:bg-green-700"></div>
          <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] bg-green-600 dark:bg-green-500"></div>
          <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] bg-green-800 dark:bg-green-300"></div>
          <span>More</span>
        </div>
      </div>

      {/* Graph Container */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-1 sm:pb-2 scrollbar-thin"
      >
        <div className="flex min-w-fit w-full">
          {/* Day Labels Column */}
          <div className="flex flex-col gap-[2px] sm:gap-[3px] pr-2 sm:pr-4 lg:pr-8 text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 pt-0">
            <div className="h-[9px] sm:h-[11px]"></div>
            <div className="h-[9px] sm:h-[11px] flex items-center">Mon</div>
            <div className="h-[9px] sm:h-[11px]"></div>
            <div className="h-[9px] sm:h-[11px] flex items-center">Wed</div>
            <div className="h-[9px] sm:h-[11px]"></div>
            <div className="h-[9px] sm:h-[11px] flex items-center">Fri</div>
            <div className="h-[9px] sm:h-[11px]"></div>
          </div>

          {/* Months Container */}
          <div className="flex flex-1 justify-between">
            {months.map((month, monthIdx) => (
              <div
                key={monthIdx}
                className={`flex flex-col ${
                  monthIdx > 0
                    ? month.startsOnSunday
                      ? "ml-2 sm:ml-4"
                      : "ml-[3px] sm:ml-[6px]"
                    : ""
                }`}
              >
                {/* Grid for this month */}
                <div className="flex gap-[2px] sm:gap-[3px]">
                  {month.weeks.map((week, weekIdx) => (
                    <div
                      key={weekIdx}
                      className="flex flex-col gap-[2px] sm:gap-[3px]"
                    >
                      {week.map((day, dayIdx) => (
                        <div
                          key={`${monthIdx}-${weekIdx}-${dayIdx}`}
                          className={`w-[9px] h-[9px] sm:w-[11px] sm:h-[11px] transition-transform ${getColorClass(
                            day.count,
                            activityData.maxCount,
                            day.date,
                          )} ${
                            day.count >= 0
                              ? "cursor-pointer hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500"
                              : ""
                          } ${day.count >= 0 && selectedDate === day.date ? "ring-2 ring-emerald-500 dark:ring-emerald-400 z-10 scale-[1.2]" : ""}`}
                          onMouseEnter={(e) => handleMouseEnter(day, e)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => {
                            if (day.count >= 0 && onDateClick) onDateClick(day.date);
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Month Label */}
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 text-center font-medium">
                  {month.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.count >= 0 && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-medium">
            {hoveredDay.date === formattedJoinedDate ? (
              <>🎉 Joined on {formatDate(hoveredDay.date)}</>
            ) : (
              <>
                {hoveredDay.count} contribution
                {hoveredDay.count !== 1 ? "s" : ""} on{" "}
                {formatDate(hoveredDay.date)}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
