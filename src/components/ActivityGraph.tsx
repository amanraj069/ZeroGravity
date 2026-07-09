"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  isPrivate?: boolean; // When true, show a lock placeholder instead of the heatmap
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
  isPrivate = false,
}: ActivityGraphProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchActivityData = useCallback(async () => {
    // Don't fetch if the profile is marked private
    if (isPrivate) {
      setLoading(false);
      return;
    }
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
  }, [userId, isPrivate]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Scroll to end when data loads (show latest activity)
  useEffect(() => {
    if (!loading && activityData && scrollContainerRef.current) {
      const scroll = scrollContainerRef.current;
      setTimeout(() => {
        if (!scroll) return;
        const maxScroll = scroll.scrollWidth - scroll.clientWidth;
        scroll.scrollTo({
          left: Math.max(maxScroll, 0),
          behavior: "smooth",
        });
      }, 100);
    }
  }, [loading, activityData]);

  const months = useMemo(() => {
    if (!activityData) return [];

    // Create activity map for quick lookup
    const activityMap = new Map<string, number>();
    activityData.activities.forEach((a) => {
      activityMap.set(a.date, a.count);
    });

    const today = new Date();
    const result: MonthData[] = [];

    // Show the last 12 months ending at the current month
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = monthDate.getMonth();
      const monthYear = monthDate.getFullYear();

      const firstDay = new Date(monthYear, monthIndex, 1);
      const lastDay = new Date(monthYear, monthIndex + 1, 0);

      const startsOnSunday = firstDay.getDay() === 0;

      const monthData: MonthData = {
        name: MONTHS[monthIndex],
        weeks: [],
        startsOnSunday,
      };

      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());

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

          const belongsToMonth = month === monthIndex && year === monthYear;
          const activityCount = activityMap.get(dateStr) || 0;
          const isFuture = currentDate > today;

          week.push({
            date: dateStr,
            count: !belongsToMonth || isFuture ? -1 : activityCount,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        monthData.weeks.push(week);
      }

      result.push(monthData);
    }

    return result;
  }, [activityData]);

  // Format joined date for comparison
  const formattedJoinedDate = useMemo(() => 
    joinedDate ? new Date(joinedDate).toISOString().split("T")[0] : null,
    [joinedDate]
  );

  // Get color based on count
  const getColorClass = useCallback((count: number, maxCount: number, dateStr: string) => {
    if (formattedJoinedDate && dateStr === formattedJoinedDate && count >= 0) {
      return "bg-yellow-400 dark:bg-yellow-500";
    }

    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-gray-200 dark:bg-gray-700";

    if (count === 1) return "bg-green-200 dark:bg-green-900";
    if (count === 2) return "bg-green-400 dark:bg-green-700";
    if (count === 3) return "bg-green-600 dark:bg-green-500";
    return "bg-green-800 dark:bg-green-300";
  }, [formattedJoinedDate]);

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

  // Private profile: show a lock placeholder instead of the heatmap
  if (isPrivate) {
    return (
      <div
        className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 rounded-xl ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Activity
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-32 gap-2 select-none">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <p className="text-xs text-gray-400 dark:text-gray-500">Activity is private</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 rounded-xl ${className}`}
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
        className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 rounded-xl ${className}`}
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
      className={`border border-gray-200 dark:border-gray-800 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-xl ${className}`}
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
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
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
