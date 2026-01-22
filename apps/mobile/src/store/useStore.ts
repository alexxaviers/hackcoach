import create from 'zustand';
import * as SecureStore from 'expo-secure-store';

type State = {
  accessToken?: string | null;
  userId?: string | null;
  setTokens: (access?: string, userId?: string)=>Promise<void>;
  clear: ()=>Promise<void>;
}

export const useStore = create<State>((set)=>({
  accessToken: null,
  userId: null,
  setTokens: async (access, uid) => {
    if(access) await SecureStore.setItemAsync('accessToken', access);
    if(uid) await SecureStore.setItemAsync('userId', uid);
    set({ accessToken: access||null, userId: uid||null });
  },
  clear: async ()=>{
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('userId');
    set({ accessToken: null, userId: null });
  }
}));
