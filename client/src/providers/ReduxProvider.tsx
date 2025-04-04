// src/providers/ReduxProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store'; // Подключаем ваш Redux store

// Компонент, который оборачивает все приложение в Redux Provider
const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
	return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
