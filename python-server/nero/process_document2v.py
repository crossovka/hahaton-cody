import fitz  # PyMuPDF
import pdf2image
import pytesseract
import json
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from PIL import Image
import numpy as np

# Путь к Tesseract
pytesseract.pytesseract.tesseract_cmd = r"/home/crossovka/code/react/hahaton cody/python-server/nero/Tesseract-OCR/tesseract.exe"

# Функция для извлечения текста из PDF
def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    # poppler_path = r"/home/crossovka/code/react/hahaton cody/python-server/nero/poppler-24.08.0/Library/bin"  # Ваш путь к Poppler
    poppler_path = r"/home/crossovka/code/react/hahaton cody/python-server/nero/poppler-24.08.0/Library/share/man/man1/pdfinfo"  # Ваш путь к Poppler
    # pages = pdf2image.convert_from_path(pdf_path, poppler_path=poppler_path)
    pages = pdf2image.convert_from_path(pdf_path)
    full_text = []

    for page_num, (page, image) in enumerate(zip(doc, pages)):
        image = image.convert("RGB")
        text_blocks = page.get_text("dict")["blocks"]
        page_width = page.rect.width
        page_height = page.rect.height

        for block in text_blocks:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        if text:
                            full_text.append(text)
    return full_text  # Возвращаем список строк

# Функция для обработки документа с помощью обученной модели
def process_document(pdf_path, model_path="/home/crossovka/code/react/hahaton cody/python-server/nero/judicial_model"):
    # Загружаем модель и токенизатор
    tokenizer = BertTokenizer.from_pretrained(model_path)
    model = BertForSequenceClassification.from_pretrained(model_path)
    model.eval()  # Переводим модель в режим оценки

    # Загружаем label_map
    with open(f"{model_path}/label_map.json", "r", encoding="utf-8") as f:
        label_map = json.load(f)
    reverse_label_map = {v: k for k, v in label_map.items()}  # Инвертируем маппинг для получения атрибутов

    # Извлекаем текст из PDF
    text_lines = extract_text(pdf_path)

    # Подготовка результата
    result = {}

    # Обрабатываем каждую строку
    for text in text_lines:
        # Токенизируем текст
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)

        # Предсказание
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            predicted_label = torch.argmax(logits, dim=1).item()

        # Получаем атрибут
        attribute = reverse_label_map[predicted_label]

        # Добавляем в результат
        if attribute in result:
            # Если атрибут уже есть, добавляем текст в список
            if isinstance(result[attribute], list):
                result[attribute].append(text)
            else:
                result[attribute] = [result[attribute], text]
        else:
            result[attribute] = text

    return result

# Основная функция
def main(pdf_path):
    result = process_document(pdf_path)
    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    print("Результат сохранен в output.json")

if __name__ == "__main__":
    # Укажите путь к вашему документу
    PDF_PATH = "АКС Артюхова_ocr.pdf"  # Замените на путь к вашему файлу
    main(PDF_PATH)