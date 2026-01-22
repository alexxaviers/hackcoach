import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthScreen from './screens/AuthScreen';
import CoachLibraryScreen from './screens/CoachLibraryScreen';
import ChatScreen from './screens/ChatScreen';
import PaywallScreen from './screens/PaywallScreen';
import ContextScreen from './screens/ContextScreen';
import SettingsScreen from './screens/SettingsScreen';
import { initPurchases } from './store/purchases';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App(){
  useEffect(()=>{ initPurchases(); },[]);
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Coaches" component={CoachLibraryScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Paywall" component={PaywallScreen} />
          <Stack.Screen name="Context" component={ContextScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
