'use client';
import { FC, useState, useEffect } from 'react';
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

	// Логируем извлечённый текст
	useEffect(() => {
		if (extractedText) {
			console.log('Text received from server:', extractedText);
		}
	}, [extractedText]);

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
				<h1>Welcome to the Chat</h1>
				<form onSubmit={handleFileSubmit} className={styles.form}>
					<label htmlFor="pdfInput">Attach PDF file</label>
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
						{loading ? 'Uploading...' : 'Submit'}
					</button>

					{pdfFile && (
						<div className={styles.pdfPreview}>
							<h3>PDF Preview</h3>
							<object
								data={URL.createObjectURL(pdfFile)}
								type="application/pdf"
								width="100%"
								height="600px"
							>
								<p>Your browser does not support PDF preview.</p>
							</object>
						</div>
					)}
				</form>
			</div>

			{/* Правый блок с сообщением от сервера и извлечённым текстом */}
			<div className={styles.rightBlock}>
				<h1>Welcome to the Chat</h1>

				{/* Сообщение об ошибке */}
				{error && <div className={styles.errorMessage}>{error}</div>}

				{/* Сообщение от сервера */}
				{serverMessage && (
					<div className={styles.serverMessage}>{serverMessage}</div>
				)}

				{/* Выводим извлечённый текст */}
				{extractedText && extractedText.length > 0 && (
					<div className={styles.extractedText}>
						<h3>Extracted Text:</h3>
						<div className={styles.pages}>
							{extractedText.map((page, index) =>
								page.trim() ? ( // Проверяем, что текст страницы не пустой
									<div key={index} className={styles.page}>
										<pre>{page}</pre>
									</div>
								) : null
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatPage;
