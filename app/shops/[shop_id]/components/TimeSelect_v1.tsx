"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  girlId: string;
  courseMinutes: number;
  shopId: string;
  onSelect: (start: string, end: string) => void;
};

export default function TimeSelect_v1({
  girlId,
  courseMinutes,
  shopId,
  onSelect,
}: Props) {
  const [days] = useState(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      arr.push(dayjs().add(i, "day"));
    }
    return arr;
  });

  const [activeDay, setActiveDay] = useState(dayjs());
  const [shifts, setShifts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------
     🔥 シフト取得
  ----------------------------- */
  useEffect(() => {
    const load = async () => {
      const { data: shiftData } = await supabase
        .from("shifts")
        .select("*")
        .eq("therapist_id", girlId);

      const { data: resData } = await supabase
        .from("reservations")
        .select("*")
        .eq("girl_id", girlId);

      setShifts(shiftData || []);
      setReservations(resData || []);
      setLoading(false);
    };

    load();
  }, [girlId]);

  if (loading) return <div>読み込み中...</div>;

  /* --------------------------------------------
     🔥 シフトに含まれている時間帯か判定
  --------------------------------------------- */
  const isInsideShift = (slotStart: dayjs.Dayjs) => {
    return shifts.some((s) => {
      const start = dayjs(s.start_time);
      const end = dayjs(s.end_time);
      return slotStart.isAfter(start) && slotStart.isBefore(end);
    });
  };

  /* --------------------------------------------
     🔥 予約と重なるか判定
  --------------------------------------------- */
  const isReserved = (slotStart: dayjs.Dayjs, slotEnd: dayjs.Dayjs) => {
    return reservations.some((r) => {
      const start = dayjs(r.start_time);
      const end = dayjs(r.end_time);
      return slotStart.isBefore(end) && slotEnd.isAfter(start);
    });
  };

  /* --------------------------------------------
     🔥 時間スロット生成（10:00〜29:00 = 翌5時）
  --------------------------------------------- */
  const generateSlots = () => {
    const slots = [];
    for (let h = 10; h < 29; h++) {
      for (let m of [0, 30]) {
        const start = activeDay.hour(h).minute(m).second(0);
        const end = start.add(courseMinutes, "minute");
        slots.push({ start, end });
      }
    }
    return slots;
  };

  const slots = generateSlots();

  return (
    <div className="w-full">
      {/* ---------------------- 日付横スクロール ---------------------- */}
      <div className="flex overflow-x-auto gap-3 mb-6 pb-2">
        {days.map((d, idx) => {
          const isActive = d.isSame(activeDay, "day");
          const dayName = ["日", "月", "火", "水", "木", "金", "土"][d.day()];
          const isSat = d.day() === 6;
          const isSun = d.day() === 0;

          return (
            <button
              key={idx}
              onClick={() => setActiveDay(d)}
              className={`min-w-[70px] px-3 py-2 rounded-lg text-center border ${
                isActive ? "bg-green-100 border-green-600 font-bold" : "bg-white"
              } ${
                isSat ? "text-blue-500" : ""
              } ${
                isSun ? "text-red-500" : ""
              }`}
            >
              <div className="text-lg">{d.format("DD")}</div>
              <div className="text-sm">{dayName}</div>
            </button>
          );
        })}
      </div>

      {/* ---------------------- 時間グリッド（3列UI） ---------------------- */}
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot, idx) => {
          const disabledShift = !isInsideShift(slot.start);
          const disabledReserved = isReserved(slot.start, slot.end);
          const disabled = disabledShift || disabledReserved;

          const bgColor = disabledReserved
            ? "bg-red-100 text-red-600 border-red-400"
            : disabledShift
            ? "bg-gray-200 text-gray-500 border-gray-300"
            : "bg-green-100 text-green-700 border-green-500";

          const icon = disabled ? "×" : "○";

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() =>
                onSelect(
                  slot.start.format("YYYY-MM-DD HH:mm:ss"),
                  slot.end.format("YYYY-MM-DD HH:mm:ss")
                )
              }
              className={`border rounded-lg p-3 text-center font-bold ${bgColor}`}
            >
              {icon} {slot.start.format("HH:mm")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
