import fitz  # PyMuPDF
import pdf2image
import pytesseract
import json
import os

# Путь к Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\hokag\PycharmProjects\nero\Tesseract-OCR\tesseract.exe"

# Загрузка цветовых тегов
with open("color_tags.json", "r", encoding="utf-8") as f:
    COLOR_TAGS = json.load(f)


# Функция для получения цвета пикселя на изображении
def get_dominant_color(image, x, y, width=5, height=5):
    region = image.crop((x, y, x + width, y + height))
    colors = region.getcolors(width * height)
    if colors:
        return max(colors, key=lambda x: x[0])[1]  # Самый частый цвет
    return None


# Функция для извлечения текста и цветов из PDF
def extract_text_and_colors(pdf_path):
    doc = fitz.open(pdf_path)
    poppler_path = r"C:\Users\hokag\PycharmProjects\nero\poppler-24.08.0\Library\bin"  # Ваш путь к Poppler
    pages = pdf2image.convert_from_path(pdf_path, poppler_path=poppler_path)
    text_with_colors = []

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
                        if not text:
                            continue
                        x0, y0, x1, y1 = span["bbox"]
                        img_x = int(x0 * image.width / page_width)
                        img_y = int(y0 * image.height / page_height)
                        color = get_dominant_color(image, img_x, img_y)
                        if color:
                            color_hex = "#{:02x}{:02x}{:02x}".format(*color)
                            text_with_colors.append({
                                "text": text,
                                "color": color_hex,
                                "page": page_num + 1,
                                "bbox": (x0, y0, x1, y1)
                            })
    return text_with_colors


# Функция для разрешения конфликтов с одинаковыми цветами
def resolve_color_conflicts(text_with_colors):
    resolved_data = []
    for item in text_with_colors:
        color = item["color"]
        text = item["text"]
        possible_attributes = [attr for color_hex, attr in COLOR_TAGS.items() if color_hex.lower() == color.lower()]

        if len(possible_attributes) == 1:
            resolved_data.append({
                "attribute": possible_attributes[0],
                "text": text,
                "color": color,
                "page": item["page"],
                "bbox": item["bbox"]
            })
        elif len(possible_attributes) > 1:
            x0, y0, _, _ = item["bbox"]
            if "Должник" in possible_attributes and y0 < 300:
                resolved_data.append({
                    "attribute": "Должник",
                    "text": text,
                    "color": color,
                    "page": item["page"],
                    "bbox": item["bbox"]
                })
            elif "Приложение" in possible_attributes and y0 > 500:
                resolved_data.append({
                    "attribute": "Приложение",
                    "text": text,
                    "color": color,
                    "page": item["page"],
                    "bbox": item["bbox"]
                })
            elif "штраф" in possible_attributes and "штраф" in text.lower():
                resolved_data.append({
                    "attribute": "штраф",
                    "text": text,
                    "color": color,
                    "page": item["page"],
                    "bbox": item["bbox"]
                })
            elif "Сумма иного взыскания" in possible_attributes and "сумма" in text.lower():
                resolved_data.append({
                    "attribute": "Сумма иного взыскания",
                    "text": text,
                    "color": color,
                    "page": item["page"],
                    "bbox": item["bbox"]
                })
            else:
                resolved_data.append({
                    "attribute": possible_attributes[0],
                    "text": text,
                    "color": color,
                    "page": item["page"],
                    "bbox": item["bbox"]
                })
    return resolved_data


# Функция для извлечения текста из обычных документов (без цветовой разметки)
def extract_text_from_unlabeled_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = []
    for page in doc:
        text = page.get_text("text").strip()
        if text:
            full_text.append(text)
    return "\n".join(full_text)


# Функция для подготовки данных
def prepare_training_data(labeled_folder="training_data", unlabeled_folder="unlabeled_data"):
    training_examples = []

    # 1. Извлекаем данные из размеченных документов (с цветами)
    for filename in os.listdir(labeled_folder):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(labeled_folder, filename)
            text_with_colors = extract_text_and_colors(pdf_path)
            resolved_data = resolve_color_conflicts(text_with_colors)
            for item in resolved_data:
                training_examples.append({
                    "attribute": item["attribute"],
                    "text": item["text"]
                })

    # 2. Извлекаем текст из обычных документов и добавляем в примеры
    attribute_keywords = {
        "Взыскатель": ["взыскатель", "истец"],
        "Должник": ["должник", "ответчик"],
        "Сумма долга": ["сумма долга", "задолженность"],
        "Адрес должника": ["адрес должника", "место жительства"],
        "наименование суда": ["мировой судья", "суд"],
        "Госпошлина": ["госпошлина", "государственная пошлина"],
        "Приложение": ["приложение", "приложения"]
    }

    for filename in os.listdir(unlabeled_folder):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(unlabeled_folder, filename)
            text = extract_text_from_unlabeled_pdf(pdf_path)
            for attribute, keywords in attribute_keywords.items():
                for keyword in keywords:
                    if keyword.lower() in text.lower():
                        lines = text.split("\n")
                        for line in lines:
                            if keyword.lower() in line.lower():
                                training_examples.append({
                                    "attribute": attribute,
                                    "text": line.strip()
                                })
                                break
                        break

    return training_examples


# Основная функция
def main():
    # Подготовка данных
    training_examples = prepare_training_data(
        labeled_folder="training_data",  # Папка с 15 размеченными документами
        unlabeled_folder="unlabeled_data"  # Папка с 500 обычными документами
    )

    # Сохранение примеров для few-shot learning
    with open("training_examples.json", "w", encoding="utf-8") as f:
        json.dump(training_examples, f, ensure_ascii=False, indent=4)
    print("Примеры для few-shot learning сохранены в training_examples.json")


if __name__ == "__main__":
    main()