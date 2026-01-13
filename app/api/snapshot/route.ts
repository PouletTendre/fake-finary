import { NextRequest, NextResponse } from "next/server";
import { createPortfolioSnapshot } from "@/lib/snapshot-service";
import { getPortfolioData } from "@/lib/actions";

// This endpoint should be called every 15 minutes by a cron job
// You can use: Vercel Cron, GitHub Actions, or a simple cron on your server
// Example cron: */15 * * * * curl http://localhost:3000/api/snapshot?secret=your-secret

export async function GET(request: NextRequest) {
  // Simple secret protection (set CRON_SECRET in env)
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "dev-secret";

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current portfolio value
    const { summary } = await getPortfolioData();
    
    // Create snapshot
    const snapshot = await createPortfolioSnapshot(summary.totalValue);

    return NextResponse.json({
      success: true,
      snapshot: {
        date: snapshot.date,
        portfolioValue: snapshot.totalValueEur,
        invested: snapshot.totalInvestedEur,
      },
    });
  } catch (error) {
    console.error("[SNAPSHOT API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
