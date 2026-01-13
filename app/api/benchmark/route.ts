import { NextRequest, NextResponse } from "next/server";
import { getIndexHistory, MARKET_INDICES, BenchmarkKey } from "@/lib/yahoo-finance";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key") as BenchmarkKey;
  const startDate = searchParams.get("startDate");

  if (!key || !startDate) {
    return NextResponse.json(
      { error: "Missing key or startDate parameter" },
      { status: 400 }
    );
  }

  if (!MARKET_INDICES[key]) {
    return NextResponse.json(
      { error: `Invalid benchmark key: ${key}` },
      { status: 400 }
    );
  }

  try {
    const data = await getIndexHistory(key, new Date(startDate));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching benchmark data:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmark data" },
      { status: 500 }
    );
  }
}
