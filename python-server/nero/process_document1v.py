import fitz  # PyMuPDF
import pdf2image
import pytesseract
import json
import ollama
from PIL import Image
import numpy as np

# Путь к Tesseract
pytesseract.pytesseract.tesseract_cmd = r"/home/crossovka/code/react/hahaton cody/python-server/nero/Tesseract-OCR/tesseract.exe"

# Функция для извлечения текста из PDF
def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    poppler_path = r"/home/crossovka/code/react/hahaton cody/python-server/nero/poppler-24.08.0/Library/share/man/man1/pdfinfo"  # Ваш путь к Poppler
    pages = pdf2image.convert_from_path(pdf_path, poppler_path=poppler_path)
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
    return "\n".join(full_text)

# Функция для обработки документа с помощью few-shot learning
def process_document(pdf_path, examples_file="training_examples.json", model_name="llama3"):
    # Загружаем примеры
    with open(examples_file, "r", encoding="utf-8") as f:
        examples = json.load(f)

    # Извлекаем текст из PDF
    full_text = extract_text(pdf_path)

    # Формируем промпт с примерами
    prompt = "Ты должен извлечь атрибуты из текста судебного документа. Вот примеры:\n"
    for example in examples[:10]:  # Используем до 10 примеров для экономии токенов
        prompt += f"Атрибут: {example['attribute']}, Текст: {example['text']}\n"
    prompt += f"""
\nТеперь извлеки атрибуты из следующего текста и верни результат в формате JSON:
{full_text}
Пример результата:
{{
    "Взыскатель": "ООО Аваринно-посетинонгельны комнания",
    "Должник": "Барахтенко Дмитрий Сергеевич",
    "Сумма долга": "12086.26 рублей"
}}
"""

    # Запрос к модели
    response = ollama.chat(
        model=model_name,
        messages=[{"role": "user", "content": prompt}]
    )

    # Парсим результат
    try:
        result = json.loads(response["message"]["content"])
    except:
        result = {}
        lines = response["message"]["content"].split("\n")
        for line in lines:
            if ":" in line:
                key, value = line.split(":", 1)
                result[key.strip()] = value.strip()
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