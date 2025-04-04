'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useAppDispatch } from '@/redux/store';
import { login } from '@/redux/slices/auth/asyncActions';
import { ILoginPayload } from '@/redux/slices/auth/types';

import Input from '@/components/elements/Input';

import styles from './LoginForm.module.scss';

const schema = yup.object().shape({
	email: yup.string().email('Неверный email').required('Email обязателен'),
	password: yup
		.string()
		.min(6, 'Минимум 6 символов')
		.required('Пароль обязателен'),
});

export default function LoginForm() {
	const dispatch = useAppDispatch();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ resolver: yupResolver(schema) });

	const onSubmit = async (data: ILoginPayload) => {
		// Отправка данных в Redux
		await dispatch(login(data));

		// Редиректим на страницу чата после успешного логина
		if (typeof window !== 'undefined') {
			window.location.href = '/chat'; // Редирект через window.location
		}
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
			<h2>Вход</h2>
			<Input
				label="Email"
				name="email"
				type="email"
				register={register}
				error={errors.email?.message}
			/>
			<Input
				label="Пароль"
				name="password"
				type="password"
				register={register}
				error={errors.password?.message}
			/>
			<button type="submit">Войти</button>
		</form>
	);
}
