"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function CompletePage() {
  const params = useSearchParams();
  const router = useRouter();

  const shop_id = params.get("shop_id");
  const girl_name = params.get("girl_name") ?? "セラピスト";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      
      {/* ✔ 完了アイコン */}
      <CheckCircle className="text-green-600 mb-4" size={80} />

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        予約が完了しました
      </h1>

      {/* セラピスト名 */}
      <p className="text-lg text-gray-600 mb-6">
        担当セラピスト：<span className="font-semibold">{girl_name}</span>
      </p>

      {/* 戻るボタン群 */}
      <div className="w-full max-w-sm flex flex-col gap-3">

        {/* 店舗トップへ戻る */}
        <button
          onClick={() => router.push(`/shops/${shop_id}`)}
          className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-bold shadow"
        >
          店舗トップへ戻る
        </button>

        {/* ホームへ戻る */}
        <button
          onClick={() => router.push(`/`)}
          className="w-full bg-gray-200 py-3 rounded-xl text-lg"
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  );
}
