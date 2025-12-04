"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ---------- 型定義 ----------

type Shift = {
  id: string;
  therapist_id: string;
  date: string;          // "2025-12-07" など
  start_time: string;    // timestamp or time 文字列
  end_time: string;      // timestamp or time 文字列
};

type Reservation = {
  id: string;
  therapist_id: string;
  start_time: string;    // timestamp
  end_time: string;      // timestamp
  status: string;
};

type Course = {
  id: string;
  name: string;
  base_price: number;
  duration_minutes: number;
};

type DayInfo = {
  label: string;   // 03
  youbi: string;   // 水
  iso: string;     // 2025-12-03
  dow: number;     // 0:日〜6:土
};

const WEEK_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

// 30分刻みのスロット
const TIME_SLOTS: string[] = (() => {
  const list: string[] = [];
  for (let h = 0; h < 24; h++) {
    list.push(`${String(h).padStart(2, "0")}:00`);
    list.push(`${String(h).padStart(2, "0")}:30`);
  }
  return list;
})();

// 文字列 "YYYY-MM-DD" 生成
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------- メインコンポーネント ----------

export default function TimeSelectPage({
  params,
}: {
  params: { shop_id: string };
}) {
  const router = useRouter();
  const search = useSearchParams();

  const shop_id = params.shop_id;
  const girl_id = search.get("girl_id");
  const course_id = search.get("course_id");

  const [days, setDays] = useState<DayInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [course, setCourse] = useState<Course | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------ 初期チェック ------------------

  useEffect(() => {
    if (!girl_id || !course_id) {
      alert("コースまたはセラピスト情報が不足しています。");
      router.push(`/shops/${shop_id}/girls`);
      return;
    }
  }, [girl_id, course_id, router, shop_id]);

  // ------------------ 14日分の日付を作成 ------------------

  useEffect(() => {
    const today = new Date();
    const list: DayInfo[] = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      list.push({
        label: String(d.getDate()).padStart(2, "0"),
        youbi: WEEK_LABEL[d.getDay()],
        iso: toIsoDate(d),
        dow: d.getDay(),
      });
    }

    setDays(list);
    if (list.length > 0) setSelectedDate(list[0].iso);
  }, []);

  // ------------------ Supabase からデータ取得 ------------------

  useEffect(() => {
    const load = async () => {
      if (!girl_id || !course_id || days.length === 0) return;

      setLoading(true);

      const from = days[0].iso;
      const to = days[days.length - 1].iso;

      // コース取得
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, base_price, duration_minutes")
        .eq("id", course_id)
        .maybeSingle<Course>();

      // シフト取得（複数枠想定）
      const { data: shiftData } = await supabase
        .from("shifts")
        .select("*")
        .eq("therapist_id", girl_id)
        .gte("date", from)
        .lte("date", to);

      // 予約取得
      const { data: reservationData } = await supabase
        .from("reservations")
        .select("*")
        .eq("therapist_id", girl_id)
        .gte("start_time", `${from} 00:00`)
        .lte("start_time", `${to} 23:59`);

      setCourse(courseData ?? null);
      setShifts((shiftData as Shift[]) ?? []);
      setReservations((reservationData as Reservation[]) ?? []);
      setLoading(false);
    };

    load();
  }, [girl_id, course_id, days]);

  // ------------------ 判定ロジック ------------------

  // 指定日のシフトだけ抽出
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = s.date; // "YYYY-MM-DD" 前提
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [shifts]);

  // 指定日の予約だけ抽出
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    for (const r of reservations) {
      const start = new Date(r.start_time);
      const key = toIsoDate(start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return map;
  }, [reservations]);

  // スロットがシフト内か？
  const isInShift = (isoDate: string, time: string): boolean => {
    const dayShifts = shiftsByDate.get(isoDate);
    if (!dayShifts || dayShifts.length === 0) return false;

    // time は "HH:MM"
    const [h, m] = time.split(":").map(Number);

    const slotStart = new Date(`${isoDate}T${time}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return dayShifts.some((s) => {
      const sStart = new Date(s.start_time);
      const sEnd = new Date(s.end_time);
      // シフト [start, end) 内なら OK
      return slotStart >= sStart && slotEnd <= sEnd;
    });
  };

  // スロットが予約済みか？
  const isReserved = (isoDate: string, time: string): boolean => {
    const dayReservations = reservationsByDate.get(isoDate);
    if (!dayReservations || dayReservations.length === 0) return false;

    const slotStart = new Date(`${isoDate}T${time}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return dayReservations.some((r) => {
      const rStart = new Date(r.start_time);
      const rEnd = new Date(r.end_time);
      // 予約と少しでも被っていたら NG
      return slotStart < rEnd && slotEnd > rStart;
    });
  };

  // ------------------ スロットクリック ------------------

  const handleSelectTime = (time: string) => {
    if (!course || !course.duration_minutes) return;
    if (!girl_id || !course_id || !selectedDate) return;

    const start = new Date(`${selectedDate}T${time}:00`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + course.duration_minutes);

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    router.push(
      `/reserve/confirm?shop_id=${shop_id}&course_id=${course_id}&girl_id=${girl_id}&start=${encodeURIComponent(
        startStr
      )}&end=${encodeURIComponent(endStr)}`
    );
  };

  // ------------------ UI ------------------

  if (loading || !course) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        日時を選択（{course.name}）
      </h1>

      {/* 日付ヘッダー（14日・横スクロール） */}
      <div className="flex overflow-x-auto space-x-2 mb-4">
        {days.map((d) => {
          const isSelected = d.iso === selectedDate;
          const isWeekend = d.dow === 0 || d.dow === 6;

          return (
            <button
              key={d.iso}
              className={`flex flex-col items-center px-3 py-2 rounded-md border text-sm min-w-[52px]
                ${
                  isSelected
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-800 border-gray-300"
                }
                ${!isSelected && isWeekend ? "bg-pink-50" : ""}
              `}
              onClick={() => setSelectedDate(d.iso)}
            >
              <span className="text-base font-semibold">{d.label}</span>
              <span
                className={
                  isWeekend ? "text-red-500 text-xs" : "text-gray-500 text-xs"
                }
              >
                {d.youbi}
              </span>
            </button>
          );
        })}
      </div>

      {/* 時間グリッド（3列・スクショ風） */}
      <div className="grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((t) => {
          if (!selectedDate) return null;

          const inShift = isInShift(selectedDate, t);
          const reserved = inShift && isReserved(selectedDate, t);

          let bg = "bg-gray-200 text-gray-400"; // デフォルト：グレー（シフト外）
          let cursor = "cursor-not-allowed";

          if (inShift && !reserved) {
            bg = "bg-green-100 text-green-800 border border-green-400";
            cursor = "cursor-pointer hover:bg-green-200";
          }
          if (reserved) {
            bg = "bg-red-100 text-red-800 border border-red-400";
            cursor = "cursor-not-allowed";
          }

          return (
            <button
              key={`${selectedDate}_${t}`}
              disabled={!inShift || reserved}
              onClick={() => handleSelectTime(t)}
              className={`py-2 text-sm rounded-md ${bg} ${cursor}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* 戻る */}
      <div className="mt-6 text-center">
        <button
          className="text-sm text-gray-500 underline"
          onClick={() => router.push(`/shops/${shop_id}/reserve?girl_id=${girl_id}`)}
        >
          ← コース選択に戻る
        </button>
      </div>
    </div>
  );
}
