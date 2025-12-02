"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeCalendar from "./components/TimeCalendar";
import dayjs from "dayjs";

// ===============================
// コース
// ===============================
const courses = [
  { id: "60", name: "60分", duration_minutes: 60, base_price: 14000 },
  { id: "100", name: "100分", duration_minutes: 100, base_price: 20000 },
  { id: "130", name: "130分", duration_minutes: 130, base_price: 23000 },
];

// ===============================
// キャスト
// ===============================
const girls = [
  { id: "kana", name: "かな" },
  { id: "asuka", name: "あすか" },
  { id: "mayu", name: "まゆ" },
];

export default function ReservePage() {
  const [step, setStep] = useState<"course" | "girl" | "datetime" | "confirm">("course");

  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedGirl, setSelectedGirl] = useState<any>(null);

  const [reservedList, setReservedList] = useState<any[]>([]);

  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);

  // 🔥キャスト選択後に予約データ取得
  useEffect(() => {
    const loadReserved = async () => {
      if (!selectedGirl) return;
      const { data } = await supabase
        .from("reservations")
        .select("start_time, end_time")
        .eq("girl_id", selectedGirl.id);

      setReservedList(data || []);
    };

    loadReserved();
  }, [selectedGirl]);

  // 🔥予約送信
  const sendReservation = async () => {
    if (!selectedCourse || !selectedGirl || !selectedStart || !selectedEnd) {
      alert("データ不足");
      return;
    }

    const { error } = await supabase.from("reservations").insert({
      course_id: selectedCourse.id,
      course_name: selectedCourse.name,
      price: selectedCourse.base_price,
      girl_id: selectedGirl.id,
      girl_name: selectedGirl.name,
      start_time: selectedStart,
      end_time: selectedEnd,
      status: "pending",
    });

    if (error) {
      alert("送信失敗");
      return;
    }

    alert("予約を送信しました！");
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">

      {/* STEP 1: コース */}
      {step === "course" && (
        <div>
          <h1 className="text-xl font-bold mb-4">コースを選択</h1>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => {
                setSelectedCourse(course);
                setStep("girl");
              }}
              className="w-full bg-green-500 text-white p-4 rounded-lg mb-3 flex justify-between"
            >
              <span>{course.name}</span>
              <span>¥{course.base_price.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: キャスト */}
      {step === "girl" && (
        <div>
          <h1 className="text-xl font-bold mb-4">キャストを選択</h1>
          {girls.map((girl) => (
            <button
              key={girl.id}
              onClick={() => {
                setSelectedGirl(girl);
                setStep("datetime");
              }}
              className="w-full bg-white border p-4 rounded-lg mb-3 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <span>{girl.name}</span>
            </button>
          ))}

          <button
            onClick={() => setStep("course")}
            className="w-full mt-4 bg-gray-300 p-3 rounded-lg"
          >
            ← コース選択に戻る
          </button>
        </div>
      )}

      {/* STEP 3: 日時選択 */}
      {step === "datetime" && selectedCourse && selectedGirl && (
        <div>
          <h1 className="text-xl font-bold mb-4">
            日時を選択（キャスト：{selectedGirl.name}）
          </h1>

          <TimeCalendar
            courseMinutes={selectedCourse.duration_minutes}
            reservedList={reservedList}
            onSelect={(s, e) => {
              setSelectedStart(s);
              setSelectedEnd(e);
              setStep("confirm");
            }}
          />

          <button
            onClick={() => setStep("girl")}
            className="w-full mt-6 bg-gray-300 p-3 rounded-lg"
          >
            ← キャストに戻る
          </button>
        </div>
      )}

      {/* STEP 4: 確認 */}
      {step === "confirm" && (
        <div>
          <h1 className="text-xl font-bold mb-4">予約内容の確認</h1>

          <div className="bg-white p-4 rounded-lg shadow">
            <p>■ コース：{selectedCourse.name}</p>
            <p>■ キャスト：{selectedGirl.name}</p>
            <p>■ 開始：{dayjs(selectedStart).format("YYYY/MM/DD HH:mm")}</p>
            <p>■ 終了：{dayjs(selectedEnd).format("YYYY/MM/DD HH:mm")}</p>
            <p className="font-bold mt-2">
              ■ 料金：¥{selectedCourse.base_price.toLocaleString()}
            </p>
          </div>

          <button
            onClick={sendReservation}
            className="w-full mt-6 bg-green-600 text-white p-3 rounded-lg"
          >
            仮予約を送信する
          </button>

          <button
            onClick={() => setStep("datetime")}
            className="w-full mt-3 bg-gray-300 p-3 rounded-lg"
          >
            ← 日時へ戻る
          </button>
        </div>
      )}
    </main>
  );
}
