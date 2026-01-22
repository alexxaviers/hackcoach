import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import client from '../api/client';

export default function ChatScreen({ route }: any){
  const { coachId } = route.params || { coachId: 'focus' };
  const [session, setSession] = useState<any>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(()=>{
    async function create(){
      try{
        const res = await client.post('/sessions', { coachId });
        setSession(res.data);
        const s = await client.get(`/sessions/${res.data.id}`);
        setMessages(s.data.messages || []);
      }catch(e){
        console.error(e);
      }
    }
    create();
  },[]);

  async function send(){
    if(!session) return;
    const res = await client.post(`/sessions/${session.id}/messages`, { content: text });
    setMessages((m)=>[...m, { role: 'user', content: text }, res.data.assistant ]);
    setText('');
  }

  return (
    <View style={{flex:1,padding:12}}>
      <FlatList data={messages} keyExtractor={(it,idx)=>String(idx)} renderItem={({item})=> (
        <View style={{padding:8,backgroundColor: item.role==='assistant' ? '#eef' : '#efe', marginBottom:6}}>
          <Text>{item.content || item.content?.content || JSON.stringify(item)}</Text>
        </View>
      )} />
      <TextInput value={text} onChangeText={setText} style={{borderWidth:1,padding:8,marginBottom:8}} />
      <Button title="Send" onPress={send} />
    </View>
  );
}
