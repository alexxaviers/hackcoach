import React from 'react';
import { View, Text, Button } from 'react-native';
import { useStore } from '../store/useStore';
import client from '../api/client';

export default function SettingsScreen(){
  const clear = useStore(s=>s.clear);
  return (
    <View style={{padding:16}}>
      <Button title="Restore Purchases" onPress={async ()=>{ try{ await client.get('/me/entitlement'); alert('Synced'); }catch(e){ alert('Failed'); } }} />
      <View style={{height:12}} />
      <Button title="Logout" onPress={async ()=>{ await clear(); alert('Logged out'); }} />
    </View>
  );
}
