"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

const NO_IMAGE =
  "https://fuuakwurtnsfdtfmwfqk.supabase.co/storage/v1/object/public/assets/noimage.webp";

export default function ConfirmPage() {
  const params = useSearchParams();
  const router = useRouter();

  const course_id = params.get("course_id");
  const girl_id = params.get("girl_id");
  const start = params.get("start");
  const end = params.get("end");

  const [course, setCourse] = useState<any>(null);
  const [girl, setGirl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------
     🔥 URL パラメータからデータを取得
  -------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!course_id || !girl_id || !start || !end) {
        setLoading(false);
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", course_id)
        .maybeSingle();

      const { data: girlData } = await supabase
        .from("girls")
        .select("*")
        .eq("id", girl_id)
        .maybeSingle();

      setCourse(courseData);
      setGirl(girlData);
      setLoading(false);
    };

    load();
  }, [course_id, girl_id, start, end]);

  if (loading) return <div className="p-6">読み込み中...</div>;

  if (!course || !girl) {
    return <div className="p-6">予約情報が不足しています。</div>;
  }

  /* -------------------------------------
     🔥 予約を送信（API 経由）
  -------------------------------------- */
  const send = async () => {
    const res = await fetch("/reserve/api/reserve", {
      method: "POST",
      body: JSON.stringify({
        shop_id: girl.shop_id,
        course_id,
        girl_id,
        start,
        end,
      }),
    });

    if (!res.ok) {
      alert("予約送信エラーが発生しました");
      return;
    }

    router.push("/reserve/complete");
  };

  /* -------------------------------------
   🔙 戻るボタン（キャスト選択に戻す）
  -------------------------------------- */
  const goBack = () => {
  if (!course_id) {
    router.push("/reserve");
    return;
  }

  router.push(`/reserve/girl?course_id=${course_id}`);
};


  /* -------------------------------------
     UI
  -------------------------------------- */
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">予約内容の確認</h1>

      <div className="bg-white p-5 shadow rounded-lg">
        {/* セラピスト */}
        <div className="flex items-center mb-4">
          <img
            src={girl.avatar_url || NO_IMAGE}
            className="w-20 h-20 rounded-full object-cover border"
          />
          <div className="ml-4">
            <p className="text-lg font-bold">{girl.name}</p>
          </div>
        </div>

        {/* コース */}
        <p className="mt-2">コース：{course.name}</p>
        <p>料金：{course.base_price.toLocaleString()}円</p>

        {/* 日時 */}
        <p className="mt-4 font-bold">開始：</p>
        <p>{dayjs(start).format("YYYY/MM/DD HH:mm")}</p>

        <p className="mt-2 font-bold">終了：</p>
        <p>{dayjs(end).format("YYYY/MM/DD HH:mm")}</p>

        {/* ボタン */}
        <button
          onClick={send}
          className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg font-bold"
        >
          この内容で予約する
        </button>

        <button
          onClick={goBack}
          className="mt-3 w-full py-3 bg-gray-300 rounded-lg font-bold"
        >
          ← 戻る
        </button>
      </div>
    </div>
  );
}
