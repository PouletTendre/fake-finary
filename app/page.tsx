import { getPortfolioData, getPortfolioHistory } from "@/lib/actions";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const { holdings, summary } = await getPortfolioData();
  const history = await getPortfolioHistory();

  return (
    <DashboardClient 
      holdings={holdings} 
      summary={summary} 
      history={history} 
    />
  );
}
