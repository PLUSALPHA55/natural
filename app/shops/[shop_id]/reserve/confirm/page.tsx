"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

export default function ConfirmPage() {
  const params = useSearchParams();
  const router = useRouter();

  const shop_id = params.get("shop_id");
  const course_id = params.get("course_id");
  const girl_id = params.get("girl_id");
  const start = params.get("start");
  const end = params.get("end");

  const [course, setCourse] = useState<any>(null);
  const [girl, setGirl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------
    🔥 URL のパラメータを元に Supabase から情報取得
  ------------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!shop_id || !course_id || !girl_id || !start || !end) {
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
  }, [shop_id, course_id, girl_id, start, end]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (!course || !girl)
    return <div className="p-6 text-red-500">予約情報が不足しています。</div>;

  /* -------------------------------------------------------
    🔥 予約送信
  ------------------------------------------------------- */
  const handleSend = async () => {
    const { error } = await supabase.from("reservations").insert({
      shop_id,
      course_id,
      course_name: course.name,
      price: course.base_price,
      girl_id,
      girl_name: girl.name,
      start_time: start,
      end_time: end,
      option_ids: [],
      status: "pending",
    });

    if (error) {
      console.error(error);
      alert("予約登録エラーが発生しました");
      return;
    }

    // 完了ページへ
    router.push(
      `/shops/${shop_id}/reserve/complete?girl_name=${girl.name}`
    );
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        予約内容の確認
      </h1>

      <div className="bg-white rounded-xl shadow p-5">

        {/* セラピスト */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={
              girl.avatar_url ||
              "https://fuuakwurtnsfdtfmwfqk.supabase.co/storage/v1/object/public/assets/noimage.webp"
            }
            className="w-20 h-20 rounded-full object-cover border"
          />
          <div>
            <p className="text-lg font-bold">{girl.name}</p>
            <p className="text-gray-500 text-sm">指名セラピスト</p>
          </div>
        </div>

        {/* コース */}
        <div className="mb-4">
          <p className="text-gray-500 text-sm">コース</p>
          <p className="text-lg font-semibold">{course.name}</p>
        </div>

        {/* 金額 */}
        <div className="mb-4">
          <p className="text-gray-500 text-sm">料金</p>
          <p className="text-lg font-semibold">
            ¥{course.base_price.toLocaleString()}
          </p>
        </div>

        {/* 日時 */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm">日時</p>
          <p className="text-lg font-semibold">
            {dayjs(start).format("YYYY/MM/DD HH:mm")} 〜{" "}
            {dayjs(end).format("HH:mm")}
          </p>
        </div>

        {/* ボタン */}
        <button
          onClick={handleSend}
          className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-bold"
        >
          予約を確定する
        </button>

        <button
          onClick={() =>
            router.push(`/shops/${shop_id}/reserve/time?course_id=${course_id}&girl_id=${girl_id}`)
          }
          className="w-full bg-gray-200 mt-3 py-3 rounded-xl"
        >
          ← 戻る
        </button>
      </div>
    </div>
  );
}
