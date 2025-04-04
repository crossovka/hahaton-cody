import axios from 'axios';

export const getErrorMessage = (error: unknown): string => {
	// Если ошибка является экземпляром AxiosError
	if (axios.isAxiosError(error)) {
		// Если есть ответ с сообщением об ошибке
		if (error.response && error.response.data && error.response.data.message) {
			return error.response.data.message;
		}
		return error.message;
	}
	// Если ошибка имеет тип Error
	if (error instanceof Error) {
		return error.message;
	}
	// В остальных случаях преобразуем ошибку в строку
	return String(error);
};
