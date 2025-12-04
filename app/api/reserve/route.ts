import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      shop_id,
      course_id,
      course_name,
      price,
      girl_id,
      girl_name,
      start_time,
      end_time,
    } = body;

    if (!shop_id || !course_id || !girl_id || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ダブルブッキングチェック
    const { data: exists } = await supabase
      .from("reservations")
      .select("*")
      .eq("girl_id", girl_id)
      .lte("start_time", end_time)
      .gte("end_time", start_time);

    if (exists && exists.length > 0) {
      return NextResponse.json(
        { error: "その時間はすでに予約があります" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("reservations").insert({
      shop_id,
      course_id,
      course_name,
      price,
      girl_id,
      girl_name,
      start_time,
      end_time,
      option_ids: [],
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
