import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { uploadPdfStart, uploadPdfSuccess, uploadPdfFailure } from './slice';

// Get API_URL from environment variables
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}chat/upload-pdf`;

export const uploadPdf = createAsyncThunk(
	'chat/uploadPdf',
	async (data: { file: File }, { dispatch }) => {
		try {
			dispatch(uploadPdfStart());

			const formData = new FormData();
			formData.append('file', data.file);

			// Send request to server
			const response = await axios.post(API_URL, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			// Server response
			const message = response.data.message; // Message from server
			const extractedText = response.data.file; // Text from each page of the PDF

			// Dispatch success
			dispatch(uploadPdfSuccess({ message, extractedText }));

			return { message, extractedText };
		} catch (error: any) {
			dispatch(uploadPdfFailure(error.message));
			throw error;
		}
	}
);
