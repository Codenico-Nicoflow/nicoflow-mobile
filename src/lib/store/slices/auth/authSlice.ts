import type { IUser } from '@nicoflow/shared/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../store';

export interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser | null>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearAuth: () => initialState,
  },
});

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;

export const { setUser, setToken, setIsLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
