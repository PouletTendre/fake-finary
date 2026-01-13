import { PrismaClient } from '@prisma/client';
import YahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function fixExchangeRates() {
  try {
    // Récupérer le taux actuel
    const quote = await yahooFinance.quote('EURUSD=X');
    const eurUsdRate = quote.regularMarketPrice!; // ex: 1.17
    const exchangeRate = 1 / eurUsdRate; // ex: 0.855
    
    console.log('Taux EUR/USD actuel:', eurUsdRate);
    console.log('Taux de conversion (1$ = X€):', exchangeRate.toFixed(4));
    
    // Récupérer toutes les transactions en USD
    const usdTransactions = await prisma.transaction.findMany({
      where: { currency: 'USD' },
      include: { asset: true }
    });
    
    console.log('\nTransactions USD à corriger:', usdTransactions.length);
    
    for (const tx of usdTransactions) {
      const oldRate = tx.exchangeRate;
      const oldTotal = tx.totalEur;
      
      // Recalculer le total avec le nouveau taux
      const newTotal = (tx.quantity * tx.unitPrice + tx.fees) * exchangeRate;
      
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          exchangeRate: exchangeRate,
          totalEur: newTotal
        }
      });
      
      console.log(`- ${tx.asset.ticker}: taux ${oldRate.toFixed(4)} -> ${exchangeRate.toFixed(4)}, total ${oldTotal.toFixed(2)}€ -> ${newTotal.toFixed(2)}€`);
    }
    
    console.log('\n✅ Toutes les transactions USD ont été mises à jour !');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExchangeRates();
