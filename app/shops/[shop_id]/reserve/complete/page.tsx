"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function CompletePage() {
  const params = useSearchParams();
  const router = useRouter();

  const reservation_id = params.get("reservation_id");

  return (
    <div className="max-w-lg mx-auto px-4 py-10 text-center">
      {/* Success icon */}
      <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <span className="text-green-600 text-5xl">✔</span>
      </div>

      <h1 className="text-3xl font-bold mb-4">予約が完了しました</h1>

      <p className="text-gray-600 mb-8">
        ご予約ありがとうございます。<br />
        下記の予約番号を大切に保管してください。
      </p>

      {/* 予約IDボックス */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-gray-500 text-sm">予約番号</p>
        <p className="text-2xl font-bold mt-1">{reservation_id}</p>
      </div>

      {/* 次回予約 */}
      <button
        onClick={() => router.push("/")}
        className="w-full py-3 bg-green-600 text-white rounded-xl text-lg font-bold shadow hover:bg-green-700 transition"
      >
        ホームへ戻る
      </button>

      <button
        onClick={() => router.push("/reserve")}
        className="w-full py-3 mt-4 bg-gray-200 text-gray-700 rounded-xl text-lg"
      >
        もう一度予約する
      </button>
    </div>
  );
}
