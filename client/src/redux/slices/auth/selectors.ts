import { RootState } from '@/redux/store';
import { AuthState } from './types';

export const selectAuthState = (state: RootState): AuthState => state.auth;
export const selectUser = (state: RootState): any => state.auth.user;
export const selectToken = (state: RootState): string | null => state.auth.token;
export const selectIsLoading = (state: RootState): boolean => state.auth.isLoading;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
