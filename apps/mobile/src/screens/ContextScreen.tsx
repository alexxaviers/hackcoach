import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import client from '../api/client';

export default function ContextScreen(){
  const { control, handleSubmit } = useForm({ defaultValues: { role:'', tools:'', goals:'', prefs:'' } });
  async function onSubmit(data:any){
    await client.put('/me/context', data).catch(()=>{});
    alert('Saved');
  }
  return (
    <View style={{padding:16}}>
      <Text style={{fontSize:18}}>Personal Context (Pro)</Text>
      <Controller control={control} name="role" render={({field:{onChange,value}})=>(<TextInput placeholder="Role" value={value} onChangeText={onChange} style={{borderWidth:1,padding:8,marginVertical:6}}/>)} />
      <Controller control={control} name="tools" render={({field:{onChange,value}})=>(<TextInput placeholder="Tools" value={value} onChangeText={onChange} style={{borderWidth:1,padding:8,marginVertical:6}}/>)} />
      <Controller control={control} name="goals" render={({field:{onChange,value}})=>(<TextInput placeholder="Goals" value={value} onChangeText={onChange} style={{borderWidth:1,padding:8,marginVertical:6}}/>)} />
      <Controller control={control} name="prefs" render={({field:{onChange,value}})=>(<TextInput placeholder="Tone / Preferences" value={value} onChangeText={onChange} style={{borderWidth:1,padding:8,marginVertical:6}}/>)} />
      <Button title="Save" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
