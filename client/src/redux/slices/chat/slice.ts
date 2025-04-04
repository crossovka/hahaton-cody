import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
	loading: boolean;
	error: string | null;
	extractedText: string | null;
	serverMessage: string | null; // Новое поле для хранения сообщения от сервера
}

const initialState: ChatState = {
	loading: false,
	error: null,
	extractedText: null,
	serverMessage: null, // Инициализируем как null
};

const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		uploadPdfStart(state) {
			state.loading = true;
			state.error = null;
		},
		uploadPdfSuccess(
			state,
			action: PayloadAction<{ message: string; extractedText: string | null }>
		) {
			state.loading = false;
			state.serverMessage = action.payload.message; // Сохраняем сообщение от сервера
			state.extractedText = action.payload.extractedText; // Извлеченный текст (если есть)
			state.error = null;
		},
		uploadPdfFailure(state, action: PayloadAction<string>) {
			state.loading = false;
			state.error = action.payload;
		},
	},
});

export const { uploadPdfStart, uploadPdfSuccess, uploadPdfFailure } =
	chatSlice.actions;
export default chatSlice.reducer;
