"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CourseSelectPage() {
  const router = useRouter();
  const { shop_id } = useParams();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // 🔥 コース取得
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("shop_id", shop_id)
        .order("duration_minutes");

      if (error) {
        console.error(error);
      }

      setCourses(data || []);
      setLoading(false);
    };

    load();
  }, [shop_id]);

  if (loading) return <div className="p-6">読み込み中…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">コースを選択</h1>

      <div className="flex flex-col gap-3">
        {courses.map((course) => (
          <button
            key={course.id}
            className="w-full bg-green-500 text-white p-4 rounded-xl flex justify-between items-center"
            onClick={() =>
              router.push(
                `/shops/${shop_id}/reserve/girl?course_id=${course.id}`
              )
            }
          >
            <span className="text-lg font-bold">{course.name}</span>
            <span>¥{course.base_price.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <button
        className="mt-6 w-full bg-gray-300 p-3 rounded-xl"
        onClick={() => router.push(`/shops/${shop_id}`)}
      >
        ← 店舗トップに戻る
      </button>
    </div>
  );
}
