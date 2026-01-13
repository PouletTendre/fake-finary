"use client";

import { useState } from "react";

export type TimePeriod = "24h" | "7d" | "1m" | "3m" | "6m" | "1y" | "ytd";

interface PeriodSelectorProps {
  onChange?: (period: TimePeriod) => void;
  defaultPeriod?: TimePeriod;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7J" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1A" },
  { value: "ytd", label: "YTD" },
];

export default function PeriodSelector({ onChange, defaultPeriod = "1m" }: PeriodSelectorProps) {
  const [selected, setSelected] = useState<TimePeriod>(defaultPeriod);

  const handleSelect = (period: TimePeriod) => {
    setSelected(period);
    onChange?.(period);
  };

  return (
    <div className="inline-flex items-center bg-gray-800 rounded-lg p-1 gap-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handleSelect(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            selected === period.value
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

// Helper to get date range from period
export function getDateRangeFromPeriod(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "24h":
      start.setHours(start.getHours() - 24);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "1m":
      start.setMonth(start.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "ytd":
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}
