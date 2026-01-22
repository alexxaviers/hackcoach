import Purchases from 'react-native-purchases';

export function initPurchases(){
  const key = process.env.REVENUECAT_API_KEY || '';
  try{ Purchases.configure({ apiKey: key }); }catch(e){ console.warn('Purchases init failed', e); }
}
