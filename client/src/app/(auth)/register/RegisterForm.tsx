'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useAppDispatch } from '@/redux/store';
import { IRegisterPayload } from '@/redux/slices/auth/types';
import { register as registerUser } from '@/redux/slices/auth/asyncActions';

import Input from '@/components/elements/Input';

import styles from './RegisterForm.module.scss';


const schema = yup.object().shape({
	name: yup.string().required('Имя обязательно'),
	last_name: yup.string().required('Фамилия обязательна'),
	email: yup.string().email('Неверный email').required('Email обязателен'),
	password: yup
		.string()
		.min(6, 'Минимум 6 символов')
		.required('Пароль обязателен'),
});

export default function RegisterForm() {
	const dispatch = useAppDispatch();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<IRegisterPayload>({ resolver: yupResolver(schema) });

	const onSubmit = (data: IRegisterPayload) => {
		dispatch(registerUser(data));
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
			<h2>Регистрация</h2>
			<Input
				label="Имя"
				name="name"
				register={register}
				error={errors.name?.message}
			/>
			<Input
				label="Фамилия"
				name="last_name"
				register={register}
				error={errors.last_name?.message}
			/>
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
			<button type="submit">Зарегистрироваться</button>
		</form>
	);
}
