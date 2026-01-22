import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useNavigation } from '@react-navigation/native';

export default function CoachLibraryScreen(){
  const [coaches, setCoaches] = useState<any[]>([]);
  const nav = useNavigation();
  useEffect(()=>{ client.get('/coaches').then(r=>setCoaches(r.data)).catch(()=>{}); },[]);
  return (
    <View style={{flex:1,padding:16}}>
      <Text style={{fontSize:20, marginBottom:10}}>Coaches</Text>
      <FlatList data={coaches} keyExtractor={c=>c.id} renderItem={({item})=> (
        <TouchableOpacity style={{padding:12,borderWidth:1,marginBottom:8}} onPress={()=>{
          if(item.isPremium){ nav.navigate('Paywall' as any, { coachId: item.id }); } else { nav.navigate('Chat' as any, { coachId: item.id }); }
        }}>
          <Text style={{fontWeight:'bold'}}>{item.name} {item.isPremium ? '· Pro' : ''}</Text>
          <Text>{item.description}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}
