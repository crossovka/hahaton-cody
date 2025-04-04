import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
	uploadPdfStart,
	uploadPdfSuccess,
	uploadPdfFailure,
} from './slice';

// Получаем API_URL из переменных окружения
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}chat/upload-pdf`; // Формируем URL

export const uploadPdf = createAsyncThunk(
	'chat/uploadPdf',
	async (data: { file: File }, { dispatch }) => {
		try {
			dispatch(uploadPdfStart());

			const formData = new FormData();
			formData.append('file', data.file);

			// Отправка запроса на сервер
			const response = await axios.post(API_URL, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			// Ответ от сервера
			const message = response.data.message; // Сообщение от сервера
			const extractedText = response.data.file
				? `Извлеченный файл: ${response.data.file}`
				: null; // Файл (можно получить имя файла)

			// Диспатчим успех
			dispatch(uploadPdfSuccess({ message, extractedText }));

			return { message, extractedText };
		} catch (error: any) {
			dispatch(uploadPdfFailure(error.message));
			throw error;
		}
	}
);
