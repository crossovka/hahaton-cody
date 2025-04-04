import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from './types';

const initialState: AuthState = {
	user: null,
	token: null,
	isLoading: false,
	error: null,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginStart: (state: AuthState) => {
			state.isLoading = true;
			state.error = null;
		},
		loginSuccess: (
			state: AuthState,
			action: PayloadAction<{ user: any; token: string }>
		) => {
			state.isLoading = false;
			state.user = action.payload.user;
			state.token = action.payload.token;
		},
		loginFailure: (state: AuthState, action: PayloadAction<string>) => {
			state.isLoading = false;
			state.error = action.payload;
		},
		logout: (state: AuthState) => {
			state.user = null;
			state.token = null;
		},
		// Новые редьюсеры для регистрации
		registerStart: (state: AuthState) => {
			state.isLoading = true;
			state.error = null;
		},
		registerSuccess: (
			state: AuthState,
			action: PayloadAction<{ user: any; token: string }>
		) => {
			state.isLoading = false;
			state.user = action.payload.user;
			state.token = action.payload.token;
		},
		registerFailure: (state: AuthState, action: PayloadAction<string>) => {
			state.isLoading = false;
			state.error = action.payload;
		},
	},
});

export const {
	loginStart,
	loginSuccess,
	loginFailure,
	logout,
	registerStart,
	registerSuccess,
	registerFailure,
} = authSlice.actions;
export default authSlice.reducer;
