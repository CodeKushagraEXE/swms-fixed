import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthResponse } from '../../types';

interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; }

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    isAuthenticated: !!localStorage.getItem('token'),
  } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      const { token, id, name, email, role } = action.payload;
      state.token = token; state.user = { id, name, email, role }; state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, name, email, role }));
    },
    logout: (state) => {
      state.token = null; state.user = null; state.isAuthenticated = false;
      localStorage.removeItem('token'); localStorage.removeItem('user');
    },
  },
});
export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
