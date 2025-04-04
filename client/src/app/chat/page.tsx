'use client'
import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/redux/store';
import { uploadPdf } from '@/redux/slices/chat/asyncActions';
import styles from './ChatPage.module.scss';

const ChatPage: FC = () => {
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const dispatch = useAppDispatch();

	// Получаем состояние из Redux
	const { loading, error, extractedText, serverMessage } = useSelector(
		(state: RootState) => state.chat
	);

	const handleFileSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!pdfFile) {
			return;
		}

		dispatch(uploadPdf({ file: pdfFile }));
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files ? event.target.files[0] : null;
		setPdfFile(file);
	};

	return (
		<div className={styles.container}>
			{/* Левый блок с кнопкой для прикрепления файла */}
			<div className={styles.leftBlock}>
				<h1>Добро пожаловать в чат</h1>
				<form onSubmit={handleFileSubmit} className={styles.form}>
					<label htmlFor="pdfInput">Прикрепите PDF файл</label>
					<input
						type="file"
						id="pdfInput"
						accept=".pdf"
						onChange={handleFileChange}
						className={styles.input}
					/>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={loading}
					>
						{loading ? 'Загрузка...' : 'Отправить'}
					</button>

					{pdfFile && (
						<div className={styles.pdfPreview}>
							<h3>Предпросмотр PDF</h3>
							<object
								data={URL.createObjectURL(pdfFile)}
								type="application/pdf"
								width="100%"
								height="600px"
							>
								<p>Ваш браузер не поддерживает PDF-просмотр.</p>
							</object>
						</div>
					)}
				</form>
			</div>

			{/* Правый блок с сообщением от сервера и извлеченным текстом */}
			<div className={styles.rightBlock}>
				<h1>Добро пожаловать в чат</h1>

				{/* Сообщение об ошибке */}
				{error && <div className={styles.errorMessage}>{error}</div>}

				{/* Сообщение от сервера */}
				{serverMessage && (
					<div className={styles.serverMessage}>
						<h3>Сообщение от сервера:</h3>
						<p>{serverMessage}</p> {/* Отображаем сообщение от сервера */}
					</div>
				)}

				{/* Вывод извлеченного текста */}
				{extractedText && (
					<div className={styles.extractedText}>
						<h3>Извлеченный текст:</h3>
						<p>{extractedText}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatPage;
