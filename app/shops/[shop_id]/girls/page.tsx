"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Girl {
  id: string;
  name: string;
  avatar_url: string | null;
  shop_id: string;
}

export default function GirlsPage() {
  const router = useRouter();
  const { shop_id } = useParams();

  const [girls, setGirls] = useState<Girl[]>([]); // ★ 型を付けて解決

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("girls")
        .select("*")
        .eq("shop_id", shop_id);

      setGirls(data || []);
    };
    load();
  }, [shop_id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">セラピスト選択</h1>

      <div className="grid grid-cols-2 gap-4">
        {girls.map((g) => (
          <div
            key={g.id}
            className="border p-3 rounded-lg shadow cursor-pointer"
            onClick={() => router.push(`/shops/${shop_id}/reserve?girl_id=${g.id}`)}
          >
            <img
              src={g.avatar_url || "/noimg.png"}
              className="w-20 h-20 rounded-full object-cover border"
            />
            <p className="mt-2 text-center font-bold">{g.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
