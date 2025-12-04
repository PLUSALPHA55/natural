"use client";

import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  girlId: string;
  courseMinutes: number;
  onSelect: (start: string, end: string) => void;
};

// 営業時間（とりあえず固定。将来SaaSで店舗ごとに変える）
const START_HOUR = 10; // 10:00
const END_HOUR = 27; // 27:00 = 翌3:00
const SLOT_MINUTES = 30; // 30分刻み

export default function ShiftCalendar({ girlId, courseMinutes, onSelect }: Props) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0); // 0〜13 → 今日〜14日目

  // 14日分の配列（今日〜13日後まで）
  const days: Dayjs[] = Array.from({ length: 14 }, (_, i) =>
    dayjs().add(i, "day").startOf("day")
  );

  const selectedDay = days[selectedIndex];

  /* ----------------------------------------------------
    🔥 シフト取得
  ----------------------------------------------------- */
  useEffect(() => {
    const loadShifts = async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("therapist_id", girlId);

      if (!error) {
        setShifts(data || []);
      }
    };
    loadShifts();
  }, [girlId]);

  /* ----------------------------------------------------
    🔥 予約データ取得（ダブルブッキング防止）
  ----------------------------------------------------- */
  useEffect(() => {
    const loadReservations = async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("girl_id", girlId);

      if (!error) {
        setReservations(data || []);
      }
      setLoading(false);
    };
    loadReservations();
  }, [girlId]);

  if (loading) return <div>読み込み中...</div>;

  /* ----------------------------------------------------
    🔥 シフト内かどうか判定
  ----------------------------------------------------- */
  const isWithinShift = (slotStart: Dayjs, slotEnd: Dayjs) => {
    return shifts.some((s) => {
      const start = dayjs(s.start_time);
      const end = dayjs(s.end_time);

      // 同じ日のシフトのみ対象（DBの型に合わせてここは必要に応じて調整）
      if (!slotStart.isSame(start, "day") && !slotStart.isSame(end, "day")) {
        return false;
      }

      const startOk =
        slotStart.isSame(start) || slotStart.isAfter(start);
      const endOk = slotEnd.isSame(end) || slotEnd.isBefore(end);

      return startOk && endOk;
    });
  };

  /* ----------------------------------------------------
    🔥 既存予約と重なっているか判定
  ----------------------------------------------------- */
  const hasReservationOverlap = (slotStart: Dayjs, slotEnd: Dayjs) => {
    return reservations.some((r) => {
      const start = dayjs(r.start_time);
      const end = dayjs(r.end_time);
      // 少しでもかぶっていたらNG
      return slotStart.isBefore(end) && slotEnd.isAfter(start);
    });
  };

  /* ----------------------------------------------------
    🔥 選択中の日のタイムスロット生成（10:00〜27:00の30分刻み）
  ----------------------------------------------------- */
  const slots: { start: Dayjs; end: Dayjs }[] = [];
  let current = selectedDay.clone().hour(START_HOUR).minute(0).second(0);
  const limit = selectedDay.clone().hour(END_HOUR).minute(0).second(0);

  while (current.isBefore(limit)) {
    const end = current.add(courseMinutes, "minute");
    slots.push({ start: current, end });
    current = current.add(SLOT_MINUTES, "minute");
  }

  /* ----------------------------------------------------
    🧱 UI
  ----------------------------------------------------- */
  return (
    <div className="space-y-4">
      {/* 🔴 日付バー（横スライド 14日分） */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {days.map((d, idx) => {
            const dow = d.day(); // 0:日曜, 6:土曜
            const isSelected = idx === selectedIndex;

            const base =
              "w-16 rounded-md border px-2 py-2 text-center text-sm cursor-pointer";
            const selectedStyle = "bg-blue-600 text-white border-blue-600";
            const normalStyle = "bg-white text-gray-800 border-gray-300";
            const style = isSelected ? selectedStyle : normalStyle;

            const dowColor =
              dow === 0
                ? "text-red-500"
                : dow === 6
                ? "text-blue-500"
                : "text-gray-600";

            const youbi = ["日", "月", "火", "水", "木", "金", "土"][dow];

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={base + " " + style}
              >
                <div className="text-base font-bold">
                  {d.format("DD")}
                </div>
                <div className={`text-xs ${dowColor}`}>{youbi}</div>
              </button>
            );
          })}
        </div>
      </div>

     {/* ⏰ 時間スロット（3列グリッド / スクショ仕様） */}
<div className="grid grid-cols-3 gap-2">
  {slots.map((slot, idx) => {
    const withinShift = isWithinShift(slot.start, slot.end);
    const overlap = hasReservationOverlap(slot.start, slot.end);

    const isAvailable = withinShift && !overlap;
    const disabled = !isAvailable;

    const base =
      "flex items-center justify-between rounded-md border px-3 py-2 text-sm w-full";

    const enabledStyle =
      "bg-green-50 border-green-500 text-green-700 hover:bg-green-100";
    const disabledStyle =
      "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed";

    return (
      <button
        key={idx}
        type="button"
        disabled={disabled}
        onClick={() =>
          onSelect(
            slot.start.format("YYYY-MM-DD HH:mm:ss"),
            slot.end.format("YYYY-MM-DD HH:mm:ss")
          )
        }
        className={base + " " + (disabled ? disabledStyle : enabledStyle)}
      >
        <span>{slot.start.format("HH:mm")}</span>
        <span
          className={
            "font-bold " + (disabled ? "text-red-500" : "text-green-600")
          }
        >
          {disabled ? "×" : "○"}
        </span>
      </button>
    );
  })}
</div>

    </div>
  );
}
