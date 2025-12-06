// app/api/reserve/save/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    shop_uuid,
    girl_uuid,
    therapist_id,
    course_uuid,
    course_name,
    price,
    start, // ISO文字列
    end,   // ISO文字列
    phone,
    memo,
  } = body;

  // 必須チェック
  if (!shop_uuid || !girl_uuid || !course_uuid || !start || !end) {
    return NextResponse.json(
      { error: "不足している項目があります" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          shop_id: shop_uuid,
          girl_uuid,
          therapist_id,
          course_uuid,
          course_name,
          price,
          start_time: start, // Supabase側の start_time
          end_time: end,
          phone,
          memo,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("予約保存エラー:", error);
      return NextResponse.json(
        { error: "予約保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, reservation: data }, { status: 200 });
  } catch (err) {
    console.error("予約保存中に予期せぬエラー:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
