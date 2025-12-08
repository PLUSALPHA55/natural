import dayjs from "dayjs";
import TimeChartClient from "./TimeChartClient";

interface PageProps {
  params: { shop_id: string };
  searchParams: { date?: string };
}

export default function Page({ params, searchParams }: PageProps) {
  const shopId = params.shop_id;
  const date = searchParams.date ?? dayjs().format("YYYY-MM-DD");

  console.log("🟢 shopId (from URL):", shopId);

  return <TimeChartClient shopId={shopId} initialDate={date} />;
}
