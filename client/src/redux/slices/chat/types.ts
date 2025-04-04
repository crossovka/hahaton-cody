export interface IUploadPdfResponse {
	extractedText: string;
}

export interface IUploadPdfPayload {
	file: File;
}

export interface ChatState {
	loading: boolean;
	error: string | null;
	extractedText: string | null;
	uploadedFileName: string | null; // Добавим новое поле для имени файла
}
