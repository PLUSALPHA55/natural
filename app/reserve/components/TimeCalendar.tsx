"use client";

import { useState } from "react";
import dayjs from "dayjs";

type Props = {
  courseMinutes: number; // コース時間（60分/100分 など）
  reservedList: { start: string; end: string }[];
  onSelect: (start: string, end: string) => void;
};

// 日本語曜日
const JP_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export default function TimeCalendar({ courseMinutes, reservedList, onSelect }: Props) {
  const now = dayjs();
  const [selectedDay, setSelectedDay] = useState(now);

  // 7日
  const days = [...Array(7)].map((_, i) => now.add(i, "day"));

  // 30分刻み
  const timeSlots = [...Array(48)].map((_, i) =>
    dayjs().hour(0).minute(0).second(0).add(i * 30, "minute")
  );

  // 🔥予約重複判定（コース時間に対応）
  const isOverlapped = (slotStart: dayjs.Dayjs, slotEnd: dayjs.Dayjs) => {
    return reservedList.some((r) => {
      const existStart = dayjs(r.start);
      const existEnd = dayjs(r.end);
      return slotStart.isBefore(existEnd) && slotEnd.isAfter(existStart);
    });
  };

  return (
    <div className="w-full">
      {/* ======================= 日付ライン ======================= */}
      <div className="flex overflow-auto gap-2 mb-4">
        {days.map((d) => (
          <button
            key={d.toString()}
            onClick={() => setSelectedDay(d)}
            className={`
              flex flex-col items-center px-3 py-2 rounded-md min-w-[60px]
              ${d.isSame(selectedDay, "day") ? "bg-blue-100 font-bold" : "bg-white"}
              ${d.day() === 6 ? "text-blue-500" : ""}
              ${d.day() === 0 ? "text-red-500" : ""}
            `}
          >
            <div className="text-lg">{d.format("DD")}</div>
            <div className="text-sm">{JP_WEEK[d.day()]}</div>
          </button>
        ))}
      </div>

      {/* ======================= 時間リスト ======================= */}
      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map((t) => {
          const slotStart = selectedDay
            .hour(t.hour())
            .minute(t.minute())
            .second(0);

          const slotEnd = slotStart.add(courseMinutes, "minute");

          // 🔥過去時間は無効
          const isPast = slotStart.isBefore(now);

          // 🔥予約重複
          const overlapped = isOverlapped(slotStart, slotEnd);

          const disabled = isPast || overlapped;

          return (
            <button
              key={t.toString()}
              disabled={disabled}
              onClick={() =>
                !disabled && onSelect(slotStart.toISOString(), slotEnd.toISOString())
              }
              className={`p-2 rounded-md border text-center transition
                ${
                  disabled
                    ? overlapped
                      ? "bg-red-100 text-red-500 border-red-300 cursor-not-allowed"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-50 text-green-700 border-green-400 hover:bg-green-100"
                }
              `}
            >
              {disabled ? "×" : "◯"} {slotStart.format("HH:mm")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
