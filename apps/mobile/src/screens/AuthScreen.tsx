import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import client from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';

export default function AuthScreen(){
  const { control, handleSubmit } = useForm();
  const nav = useNavigation();
  const setTokens = useStore(s=>s.setTokens);

  async function onSubmit(data: any){
    try{
      const res = await client.post('/auth/login', data);
      const { accessToken, refreshToken } = res.data;
      // decode token to get userId? assume backend returns userId via another call; store tokens
      await setTokens(accessToken, '');
      nav.navigate('Coaches' as any);
    }catch(e){
      // try signup
      try{
        await client.post('/auth/signup', data);
        const res2 = await client.post('/auth/login', data);
        const { accessToken } = res2.data;
        await setTokens(accessToken, '');
        nav.navigate('Coaches' as any);
      }catch(err){
        console.error(err);
      }
    }
  }

  return (
    <View style={{padding:20}}>
      <Text style={{fontSize:24,marginBottom:10}}>Simon — AI Coaching</Text>
      <Controller control={control} name="email" defaultValue="" render={({field:{onChange,value}})=>(
        <TextInput placeholder="Email" value={value} onChangeText={onChange} style={{borderWidth:1,padding:8,marginBottom:8}} />
      )} />
      <Controller control={control} name="password" defaultValue="" render={({field:{onChange,value}})=>(
        <TextInput placeholder="Password" value={value} onChangeText={onChange} secureTextEntry style={{borderWidth:1,padding:8,marginBottom:8}} />
      )} />
      <Button title="Sign in / Sign up" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
