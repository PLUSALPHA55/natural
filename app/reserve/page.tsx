"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * 型はざっくり any にしておく（DB の変更に強くするため）
 */
type Course = any;
type Girl = any;

type TimeRange = {
  start: number; // getTime()
  end: number;
};

export default function ReservePage() {
  const router = useRouter();
  const params = useSearchParams();

  const course_id = params.get("course_id");
  const girl_id = params.get("girl_id");

  const [course, setCourse] = useState<Course | null>(null);
  const [girl, setGirl] = useState<Girl | null>(null);
  const [loading, setLoading] = useState(true);

  const [shiftRanges, setShiftRanges] = useState<TimeRange[]>([]);
  const [reservedRanges, setReservedRanges] = useState<TimeRange[]>([]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // -------------------------------
  // 14日分の日付リスト（今日〜13日後）
  // -------------------------------
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  // -------------------------------
  // Supabase からコース / 女の子 / シフト / 予約 を取得
  // -------------------------------
  useEffect(() => {
    const load = async () => {
      if (!course_id || !girl_id) {
        setLoading(false);
        return;
      }

      // コース
      const { data: courseData, error: courseErr } = await supabase
        .from("courses")
        .select("*")
        .eq("id", course_id)
        .maybeSingle();

      if (courseErr) {
        console.error("courses error", courseErr);
      }

      // 女の子
      const { data: girlData, error: girlErr } = await supabase
        .from("girls")
        .select("*")
        .eq("id", girl_id)
        .maybeSingle();

      if (girlErr) {
        console.error("girls error", girlErr);
      }

      // シフト / 予約の期間（14日分）
      const startDay = new Date();
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 14);
      endDay.setHours(23, 59, 59, 999);

      // シフト
      const { data: shiftData, error: shiftErr } = await supabase
        .from("shifts")
        .select("*")
        .eq("girl_id", girl_id)
        .gte("start_time", startDay.toISOString())
        .lte("end_time", endDay.toISOString());

      if (shiftErr) {
        console.error("shifts error", shiftErr);
      }

      // 予約（キャンセル以外すべてブロック扱い）
      const { data: reservationData, error: resErr } = await supabase
        .from("reservations")
        .select("*")
        .eq("girl_id", girl_id)
        .gte("start_time", startDay.toISOString())
        .lte("end_time", endDay.toISOString());

      if (resErr) {
        console.error("reservations error", resErr);
      }

      // 時間帯を number に変換しておく
      const shiftRanges: TimeRange[] =
        shiftData?.map((s: any) => ({
          start: new Date(s.start_time).getTime(),
          end: new Date(s.end_time).getTime(),
        })) ?? [];

      const reservedRanges: TimeRange[] =
        reservationData?.map((r: any) => ({
          start: new Date(r.start_time).getTime(),
          end: new Date(r.end_time).getTime(),
        })) ?? [];

      setCourse(courseData ?? null);
      setGirl(girlData ?? null);
      setShiftRanges(shiftRanges);
      setReservedRanges(reservedRanges);
      setLoading(false);
    };

    load();
  }, [course_id, girl_id]);

  // -------------------------------
  // 共通ヘルパー
  // -------------------------------
  const weekdayLabel = (d: Date) => {
    const arr = ["日", "月", "火", "水", "木", "金", "土"];
    return arr[d.getDay()];
  };

  const formatTime = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // 選択中の日付の 30分刻みスロットを生成（0:00〜23:30）
  const slots = useMemo(() => {
    const day = days[selectedDayIndex];
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);

    const result: Date[] = [];
    for (let i = 0; i < 48; i++) {
      const t = new Date(start.getTime() + i * 30 * 60 * 1000);
      result.push(t);
    }
    return result;
  }, [days, selectedDayIndex]);

  // スロットの状態判定
  const getSlotStatus = (slot: Date): "closed" | "booked" | "free" => {
    const t = slot.getTime();

    const inShift = shiftRanges.some(
      (s) => t >= s.start && t < s.end
    );

    if (!inShift) return "closed";

    const booked = reservedRanges.some(
      (r) => t >= r.start && t < r.end
    );

    if (booked) return "booked";

    return "free";
  };

  const handleClickSlot = (slot: Date) => {
    if (!course || !course_id || !girl_id) return;

    // コース時間（分）※なければ 60分扱い
    const durationMinutes: number = course.duration_minutes ?? course.minutes ?? 60;

    const start = slot;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    router.push(
      `/reserve/confirm?course_id=${course_id}&girl_id=${girl_id}&start=${encodeURIComponent(
        startIso
      )}&end=${encodeURIComponent(endIso)}`
    );
  };

  // -------------------------------
  // レンダリング
  // -------------------------------
  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  if (!course_id || !girl_id || !course || !girl) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-2">予約情報が不足しています。</h1>
        <p className="text-gray-600 text-sm">
          コースまたはセラピストの情報が取得できませんでした。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 見出し */}
      <h1 className="text-xl font-bold mb-1">
        日時を選択（キャスト：{girl.name}）
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        コース：{course.name}（{course.base_price}円）
      </p>

      {/* 日付ヘッダー：14日間 横スクロール */}
      <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 border-b">
        {days.map((d, idx) => {
          const isSelected = idx === selectedDayIndex;
          const weekday = d.getDay();
          const isSun = weekday === 0;
          const isSat = weekday === 6;

          const baseText =
            isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-700";

          const textClass = isSelected ? "text-white" : baseText;
          const bgClass = isSelected ? "bg-blue-500" : "bg-gray-100";

          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex flex-col items-center justify-center min-w-[56px] px-3 py-2 rounded-md ${bgClass} ${textClass} text-sm font-medium shadow-sm`}
            >
              <span className="text-base leading-none">
                {d.getDate().toString().padStart(2, "0")}
              </span>
              <span className="text-xs mt-1">{weekdayLabel(d)}</span>
            </button>
          );
        })}
      </div>

      {/* スロット凡例 */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-200 border border-gray-300" />
          シフトなし
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-red-100 border border-red-300" />
          予約済み
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-green-100 border border-green-400" />
          予約可能
        </div>
      </div>

      {/* 30分刻みスロット（3列グリッド） */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const status = getSlotStatus(slot);
          const label = formatTime(slot);

          let cls =
            "w-full py-2 rounded-md text-sm text-center border transition ";

          if (status === "closed") {
            cls +=
              "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed";
          } else if (status === "booked") {
            cls +=
              "bg-red-100 text-red-600 border-red-300 cursor-not-allowed";
          } else {
            // free
            cls +=
              "bg-green-100 text-green-700 border-green-400 hover:bg-green-200 cursor-pointer";
          }

          return (
            <button
              key={slot.toISOString()}
              className={cls}
              disabled={status !== "free"}
              onClick={() => status === "free" && handleClickSlot(slot)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 下部：キャストに戻る（ここはお好みで遷移先を変えてOK） */}
      <div className="mt-6">
        <button
          className="w-full py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => {
            // ここは「キャスト一覧」に戻す想定
            // 実際の戻り先に合わせて URL を修正してください
            router.back();
          }}
        >
          ← キャストに戻る
        </button>
      </div>
    </div>
  );
}
