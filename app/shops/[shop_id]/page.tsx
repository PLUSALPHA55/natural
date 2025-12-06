"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabaseClient";

export default function CompletePage() {
  const params = useSearchParams();
  const router = useRouter();

  const reservationId = params.get("reservation_id");
  const shop_id = params.get("shop_id");

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------
  // 🔥 予約データ取得（安心感UP）
  // ----------------------------
  useEffect(() => {
    const load = async () => {
      if (!reservationId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", reservationId)
        .maybeSingle();

      setReservation(data);
      setLoading(false);
    };
    load();
  }, [reservationId]);

  if (loading) return <div className="p-6">読み込み中...</div>;

  if (!reservation) {
    return (
      <div className="p-6">
        <p className="text-red-500 font-bold">予約情報が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto text-center">
      {/* 成功アイコン */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl">
          ✓
        </div>
      </div>

      {/* タイトル */}
      <h1 className="text-2xl font-bold mb-2">予約が完了しました</h1>
      <p className="text-gray-600 mb-6">ご予約ありがとうございます。</p>

      {/* 予約ID */}
      <p className="text-sm mb-4 text-gray-500">
        予約ID：<span className="font-bold">{reservationId}</span>
      </p>

      {/* 内容カード */}
      <div className="bg-white shadow rounded-xl p-5 text-left mb-8">
        <p className="font-bold mb-1">■ セラピスト</p>
        <p className="mb-3">{reservation.girl_name}</p>

        <p className="font-bold mb-1">■ コース</p>
        <p className="mb-3">{reservation.course_name}</p>

        <p className="font-bold mb-1">■ 日時</p>
        <p>
          {dayjs(reservation.start_time).format("YYYY/MM/DD HH:mm")}
          {" 〜 "}
          {dayjs(reservation.end_time).format("HH:mm")}
        </p>

        <p className="font-bold mt-4 mb-1">■ 金額</p>
        <p className="text-lg font-bold text-green-600">
          ¥{Number(reservation.price).toLocaleString()}
        </p>
      </div>

      {/* ボタン */}
      <button
        className="w-full bg-green-600 text-white py-3 rounded-xl mb-3 text-lg font-semibold"
        onClick={() => router.push(`/shops/${shop_id}/reserve`)}
      >
        もう一度予約する
      </button>

      <button
        className="w-full bg-gray-300 text-gray-800 py-3 rounded-xl text-lg"
        onClick={() => router.push("/")}
      >
        トップに戻る
      </button>
    </div>
  );
}
