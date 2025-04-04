import axios from 'axios';
import toast from 'react-hot-toast';
import { AppDispatch } from '@/redux/store';
import {
	loginStart,
	loginSuccess,
	loginFailure,
	registerStart,
	registerSuccess,
	registerFailure,
} from './slice';
import { ILoginPayload, IRegisterPayload } from './types';
import { getErrorMessage } from '@/libs/utils/getErrorMessage';
import { useRouter } from 'next/router';

// Экшен для логина

// Экшен для логина
export const login =
	(payload: ILoginPayload) =>
	async (dispatch: AppDispatch): Promise<void> => {
		dispatch(loginStart());
		try {
			const { data } = await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}auth/login`,
				payload,
				{ withCredentials: true }
			);

			// Сохраняем токен в localStorage и в состоянии
			localStorage.setItem('token', data.access_token);
			dispatch(loginSuccess({ user: data.user, token: data.access_token }));
			toast.success('Вы успешно вошли!');
		} catch (error) {
			dispatch(loginFailure(getErrorMessage(error)));
			toast.error('Ошибка входа');
		}
	};

// Экшен для регистрации
export const register =
	(payload: IRegisterPayload) =>
	async (dispatch: AppDispatch): Promise<void> => {
		dispatch(registerStart());
		try {
			const { data } = await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}user/register`,
				payload,
				{ withCredentials: true }
			);

			// Сохраняем токен в localStorage и в состоянии
			localStorage.setItem('token', data.access_token);
			dispatch(registerSuccess({ user: data.user, token: data.access_token }));
			toast.success('Вы успешно зарегистрировались!');

			// Используем useRouter для редиректа
			const router = useRouter();
			router.push('/chat'); // Перенаправление на страницу чата
		} catch (error) {
			dispatch(registerFailure(getErrorMessage(error)));
			toast.error('Ошибка регистрации');
		}
	};
