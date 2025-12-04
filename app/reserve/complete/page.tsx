"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ReserveCompletePage() {
  const router = useRouter();
  const params = useSearchParams();

  const reserve_id = params.get("reserve_id");
  const course_id = params.get("course_id");
  const girl_id = params.get("girl_id");
  const start = params.get("start");
  const end = params.get("end");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">

        {/* ✔ チェックアイコン */}
        <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full bg-green-100">
          <span className="text-green-600 text-5xl">✔</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          予約が完了しました
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          ご予約いただきありがとうございます。<br />
          内容を確認のうえ、店舗よりご連絡いたします。
        </p>

        {/* 予約ID（ユーザーにとって一番安心材料） */}
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl font-bold mb-6">
          予約番号：{reserve_id}
        </div>

        {/* 予約内容 */}
        <div className="text-left bg-gray-100 p-4 rounded-xl mb-6 text-sm">
          <p><span className="font-bold">コースID：</span>{course_id}</p>
          <p><span className="font-bold">セラピスト：</span>{girl_id}</p>
          <p><span className="font-bold">開始：</span>{start?.replace("T", " ")}</p>
          <p><span className="font-bold">終了：</span>{end?.replace("T", " ")}</p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition mb-3"
        >
          ホームに戻る
        </button>

        <button
          onClick={() => router.push("/reserve")}
          className="w-full border border-green-600 text-green-600 py-3 rounded-xl font-bold hover:bg-green-50 transition"
        >
          予約ページへ戻る
        </button>
      </div>
    </div>
  );
}
