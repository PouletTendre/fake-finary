import { NextRequest, NextResponse } from "next/server";
import { searchTickers } from "@/lib/yahoo-finance";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTickers(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erreur recherche ticker:", error);
    return NextResponse.json({ results: [], error: "Erreur de recherche" }, { status: 500 });
  }
}
