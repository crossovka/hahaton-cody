'use client';

import { configureStore } from '@reduxjs/toolkit';
import {
	useDispatch,
	TypedUseSelectorHook,
	useSelector,
	useStore,
} from 'react-redux';

import auth from './slices/auth/slice'
import chat from './slices/chat/slice'

export const store = configureStore({
	reducer: {
		auth,
		chat
	},
});
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типизированный useDispatch для dispatch'а действий
export const useAppDispatch = () => useDispatch<AppDispatch>();
// Типизированный useSelector для выбора данных из хранилища
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// Типизированный useStore для хранилища
export const useAppStore = useStore.withTypes<AppStore>();

// console.log('store', store);
// console.log('store.getState', store.getState());
// console.log('store.dispatch', store.dispatch);
