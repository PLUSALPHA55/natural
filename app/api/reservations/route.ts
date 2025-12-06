// app/api/reservations/route.ts
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop_id = searchParams.get("shop_id");
  const date = searchParams.get("date");

  if (!shop_id || !date) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
    });
  }

  // SHOP + DATE に一致する予約のみ取得
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("shop_id", shop_id)
    .eq("date", date)
    .order("start_time", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
