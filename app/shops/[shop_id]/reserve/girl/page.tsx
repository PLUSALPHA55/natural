"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function GirlSelectPage() {
  const router = useRouter();
  const { shop_id } = useParams();
  const params = useSearchParams();

  const course_id = params.get("course_id");

  const [girls, setGirls] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // 🔥 女性一覧 + コース情報を取得
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      if (!course_id) return;

      // コース取得
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", course_id)
        .maybeSingle();

      setCourse(courseData);

      // 女性取得
      const { data: girlsData } = await supabase
        .from("girls")
        .select("*")
        .eq("shop_id", shop_id)
        .order("name");

      setGirls(girlsData || []);
      setLoading(false);
    };

    load();
  }, [course_id, shop_id]);

  if (loading) return <div className="p-6">読み込み中...</div>;

  if (!course) return <div className="p-6">コース情報が取得できませんでした。</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        セラピストを選択（{course.name}）
      </h1>

      <div className="flex flex-col gap-3">
        {girls.map((girl) => (
          <button
            key={girl.id}
            className="w-full bg-white border p-4 rounded-xl shadow flex items-center gap-4"
            onClick={() =>
              router.push(
                `/shops/${shop_id}/reserve/time?course_id=${course_id}&girl_id=${girl.id}`
              )
            }
          >
            <img
              src={
                girl.avatar_url ||
                "https://fuuakwurtnsfdtfmwfqk.supabase.co/storage/v1/object/public/assets/noimage.webp"
              }
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div className="text-lg">{girl.name}</div>
          </button>
        ))}
      </div>

      <button
        className="mt-6 w-full bg-gray-300 p-3 rounded-xl"
        onClick={() => router.push(`/shops/${shop_id}/reserve`)}
      >
        ← コース選択に戻る
      </button>
    </div>
  );
}
