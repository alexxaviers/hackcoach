import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import Purchases from 'react-native-purchases';
import client from '../api/client';

export default function PaywallScreen({ route, navigation }: any){
  const { coachId } = route.params || {};
  const [offerings, setOfferings] = useState<any>(null);

  useEffect(()=>{ (async ()=>{
    try{ const o = await Purchases.getOfferings(); setOfferings(o); }catch(e){ console.warn(e); }
  })(); },[]);

  async function buy(){
    try{
      // Simplified: purchase first available package
      const off = offerings?.current?.availablePackages?.[0];
      if(!off) return;
      const purchase = await Purchases.purchasePackage(off);
      // call backend to sync or call /me/entitlement
      await client.get('/me/entitlement').catch(()=>{});
      navigation.navigate('Coaches');
    }catch(e){ console.error(e); }
  }

  return (
    <View style={{padding:16}}>
      <Text style={{fontSize:18}}>Upgrade to Pro</Text>
      <Text style={{marginVertical:8}}>Unlimited sessions, all coaches, persistent memory.</Text>
      <Button title="Buy Pro" onPress={buy} />
    </View>
  );
}
