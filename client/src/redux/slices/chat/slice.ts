import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
	loading: boolean;
	error: string | null;
	extractedText: string[]; // Обновлено на массив строк
	serverMessage: string | null;
}

const initialState: ChatState = {
	loading: false,
	error: null,
	extractedText: [], // Инициализируем как пустой массив
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
			action: PayloadAction<{ message: string; extractedText: string[] }> // Обновлено на массив строк
		) {
			state.loading = false;
			state.serverMessage = action.payload.message;
			state.extractedText = action.payload.extractedText; // Массив строк для страниц
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
