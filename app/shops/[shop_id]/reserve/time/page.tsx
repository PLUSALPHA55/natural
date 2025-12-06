"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

export default function TimeSelectPage({ params }: any) {
  const router = useRouter();
  const search = useSearchParams();

  const shop_id = params.shop_id;
  const course_id = search.get("course_id");
  const girl_id = search.get("girl_id");

  const [course, setCourse] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = dayjs();

  /* ----------------------------------------------------
    🔥 14日の日付リスト
  ---------------------------------------------------- */
  const days = [...Array(14)].map((_, i) => now.add(i, "day"));

  /* ----------------------------------------------------
    🔥 コース情報（コース時間）
  ---------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("id", course_id)
        .maybeSingle();

      setCourse(data);
    };
    load();
  }, [course_id]);

  /* ----------------------------------------------------
    🔥 シフト読み込み（女性ごとの出勤時間）
  ---------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .eq("therapist_id", girl_id);

      setShifts(data || []);
    };
    load();
  }, [girl_id]);

  /* ----------------------------------------------------
    🔥 予約済み枠を取得（ダブルブッキング防止）
  ---------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*")
        .eq("girl_id", girl_id);

      setReservations(data || []);
      setLoading(false);
    };
    load();
  }, [girl_id]);

  if (loading || !course) return <div className="p-6">読み込み中...</div>;

  const duration = course.duration_minutes;

  /* ----------------------------------------------------
    🔥 シフト外かチェック
  ---------------------------------------------------- */
  const isInsideShift = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    return shifts.some((s) => {
      const st = dayjs(s.start_time);
      const ed = dayjs(s.end_time);
      return start.isBefore(ed) && end.isAfter(st);
    });
  };

  /* ----------------------------------------------------
    🔥 予約重複チェック
  ---------------------------------------------------- */
  const isReserved = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    return reservations.some((r) => {
      const st = dayjs(r.start_time);
      const ed = dayjs(r.end_time);
      return start.isBefore(ed) && end.isAfter(st);
    });
  };

  /* ----------------------------------------------------
    🔥 時間スロット生成（30分刻み／3列グリッド）
  ---------------------------------------------------- */
  const timeSlots = [...Array(48)].map((_, i) =>
    dayjs().hour(0).minute(0).second(0).add(i * 30, "minute")
  );

  return (
    <div className="p-4">

      {/* =======================
        🔷 日付バー（14日）
      ======================= */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2">
        {days.map((d) => {
          const isToday = d.isSame(now, "day");

          return (
            <button
              key={d.toString()}
              onClick={() => {
                document.getElementById(d.format("YYYY-MM-DD"))?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`
                px-3 py-2 rounded-lg min-w-[70px] text-center border
                ${isToday ? "bg-green-600 text-white" : "bg-white"}
                ${d.day() === 0 ? "text-red-500" : ""}
                ${d.day() === 6 ? "text-blue-500" : ""}
              `}
            >
              <div className="font-bold">{d.format("MM/DD")}</div>
              <div className="text-sm">{["日","月","火","水","木","金","土"][d.day()]}</div>
            </button>
          );
        })}
      </div>

      {/* =======================
        🔷 時間スロット（スクショ完全コピー）
      ======================= */}
      {days.map((day) => (
        <div key={day.toString()} id={day.format("YYYY-MM-DD")} className="mb-6">
          <h2 className="font-bold text-lg mb-2">{day.format("MM/DD (ddd)")}</h2>

          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((t) => {
              const start = day.hour(t.hour()).minute(t.minute());
              const end = start.add(duration, "minute");

              const inShift = isInsideShift(start, end);
              const reserved = isReserved(start, end);

              let color = "bg-green-500";
              let label = "◯";

              if (!inShift) {
                color = "bg-gray-300";
                label = "×";
              } else if (reserved) {
                color = "bg-red-400";
                label = "×";
              }

              return (
                <button
                  key={t.toString()}
                  disabled={!inShift || reserved}
                  className={`p-3 text-white font-bold rounded-lg ${color}`}
                  onClick={() => {
                    router.push(
                      `/shops/${shop_id}/reserve/confirm?course_id=${course_id}&girl_id=${girl_id}&start=${start.toISOString()}&end=${end.toISOString()}`
                    );
                  }}
                >
                  {label} {start.format("HH:mm")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
