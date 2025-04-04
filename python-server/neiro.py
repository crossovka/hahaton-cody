from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import os
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = './uploads/'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/neiro', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400

    # Генерируем уникальное имя файла, чтобы избежать коллизий
    unique_filename = str(uuid.uuid4()) + '.pdf'
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(file_path)

    try:
        # Извлекаем текст из PDF
        pdf_document = fitz.open(file_path)
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        pdf_document.close()

        # Возвращаем имя файла и извлеченный текст
        response_data = {
            'filename': unique_filename,
            'extractedText': text
        }

        return jsonify(response_data), 200
    except Exception as e:
        # Удаляем файл в случае ошибки
        os.remove(file_path)
        return jsonify({'error': 'Error processing PDF', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)