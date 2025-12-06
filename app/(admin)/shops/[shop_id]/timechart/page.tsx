// app/(admin)/shops/[shop_id]/timechart/page.tsx
import TimeChartClient from "./TimeChartClient";



import dayjs from "dayjs";

// ⭐ Page コンポーネントの props に型をつける（←エラー消えるポイント）
interface PageProps {
  params: { shop_id: string };
  searchParams: { date?: string };
}

export default function Page({ params, searchParams }: PageProps) {
  const shopId = params.shop_id;
  const date = searchParams?.date ?? dayjs().format("YYYY-MM-DD");

  return <TimeChartClient shopId={shopId} initialDate={date} />;
}
