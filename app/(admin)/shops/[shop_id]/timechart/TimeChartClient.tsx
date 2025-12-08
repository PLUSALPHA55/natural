"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";



import dayjs from "dayjs";


// ---- 型定義 ----
type Girl = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Shift = {
  id: string;
  therapist_id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type Reservation = {
  id: string;
  therapist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
};

// ---- 営業時間（12:00〜翌02:00） ----
function generateHours() {
  const list: string[] = [];
  let t = dayjs().hour(12).minute(0);

  for (let i = 0; i < 14; i++) {
    list.push(t.format("HH:mm"));
    t = t.add(1, "hour");
  }
  return list;
}

export default function TimeChartClient({
  shopId,
  initialDate,
}: {
  shopId: string;
  initialDate: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [girls, setGirls] = useState<Girl[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const HOURS = generateHours();

  // ---------- 女の子 ----------
  const loadGirls = async () => {
  const { data, error } = await supabase
    .from("girls")
    .select("*")
    .eq("shop_id", shopId);

  console.log("🎀 girls load result:", { shopId, data, error });

  if (data) setGirls(data);
};


  // ---------- シフト ----------
  const loadShifts = async () => {
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("shop_id", shopId)
      .eq("date", date);

    if (data) setShifts(data);
  };

  // ---------- 予約 ----------
  const loadReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("shop_id", shopId)      // ← ここが重要
      .eq("date", date);

    if (data) setReservations(data);
  };

  // 初回ロード
  useEffect(() => {
    loadGirls();
  }, []);

  // 日付変更 & 初期ロード
  useEffect(() => {
    loadShifts();
    loadReservations();
  }, [date]);

  // ========= 画面 =========
  return (
    <div className="w-full p-5">
      <h2 className="text-xl font-bold mb-3">受付台帳</h2>

      {/* 日付操作 */}
      <div className="flex gap-2 items-center mb-3">
        <button onClick={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}>＜ 前日</button>
        <span className="font-bold">{date}</span>
        <button onClick={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}>翌日 ＞</button>
        <button onClick={() => setDate(dayjs().format("YYYY-MM-DD"))}>今日</button>
      </div>

      {/* 時間ヘッダー */}
      <div className="grid grid-cols-[150px_repeat(14,1fr)] border">
        <div className="bg-gray-100 font-bold p-2 border-r">セラピスト</div>
        {HOURS.map((h) => (
          <div key={h} className="border-r p-1 bg-yellow-50 text-center">{h}</div>
        ))}
      </div>

      {/* メイン */}
      {girls.map((girl) => (
        <div key={girl.id} className="grid grid-cols-[150px_repeat(14,1fr)] border border-t-0">
          <div className="border-r p-2 font-bold">{girl.name}</div>

          {HOURS.map((t) => {
            const shift = shifts.find(
              (s) =>
                s.therapist_id === girl.id &&
                dayjs(s.start_time).format("HH:mm") <= t &&
                dayjs(s.end_time).format("HH:mm") > t
            );

            const reserve = reservations.find(
              (r) =>
                r.therapist_id === girl.id &&
                dayjs(r.start_time).format("HH:mm") <= t &&
                dayjs(r.end_time).format("HH:mm") > t
            );

            return (
              <div
                key={t}
                className={`border-r h-10 ${
                  reserve ? "bg-red-300" : shift ? "bg-green-200" : "bg-white"
                }`}
              ></div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
