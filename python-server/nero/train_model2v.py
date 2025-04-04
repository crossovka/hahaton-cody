import fitz  # PyMuPDF
import pdf2image
import pytesseract
import json
import os
from PIL import Image
import numpy as np
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import torch

# Путь к Tesseract 
pytesseract.pytesseract.tesseract_cmd = r"/home/crossovka/code/react/hahaton cody/python-server/nero/Tesseract-OCR/tesseract.exe"

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
    poppler_path = r"/home/crossovka/code/react/hahaton cody/python-server/nero/poppler-24.08.0/Library/bin"  # Ваш путь к Poppler
    # pages = pdf2image.convert_from_path(pdf_path, poppler_path=poppler_path)
    pages = pdf2image.convert_from_path(pdf_path)
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
    return "/n".join(full_text)


# Функция для подготовки данных для обучения
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
                        lines = text.split("/n")
                        for line in lines:
                            if keyword.lower() in line.lower():
                                training_examples.append({
                                    "attribute": attribute,
                                    "text": line.strip()
                                })
                                break
                        break

    return training_examples


# Функция для дообучения модели
def fine_tune_model(training_examples):
    # Создаем словарь для маппинга атрибутов на метки
    label_map = {attr: idx for idx, attr in enumerate(set([ex["attribute"] for ex in training_examples]))}
    num_labels = len(label_map)

    # Подготовка данных для обучения
    texts = [ex["text"] for ex in training_examples]
    labels = [label_map[ex["attribute"]] for ex in training_examples]

    # Создаем датасет
    dataset = Dataset.from_dict({"text": texts, "label": labels})

    # Загружаем токенизатор и модель
    tokenizer = BertTokenizer.from_pretrained("bert-base-multilingual-cased")
    model = BertForSequenceClassification.from_pretrained("bert-base-multilingual-cased", num_labels=num_labels)

    # Токенизация данных
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    tokenized_dataset = tokenized_dataset.remove_columns(["text"])
    tokenized_dataset.set_format("torch")

    # Разделяем на обучающую и тестовую выборки
    train_test_split = tokenized_dataset.train_test_split(test_size=0.1)
    train_dataset = train_test_split["train"]
    eval_dataset = train_test_split["test"]

    device = torch.device("cpu")
    model.to(device)

    # Настройка параметров обучения
    training_args = TrainingArguments(
        fp16=True,
        no_cuda=True,
        output_dir="D:/judicial_model",  # Путь для сохранения модели на диске D
        num_train_epochs=3,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir="D:/judicial_model/logs",
        logging_steps=10,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
    )


    # Создаем Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
    )

    torch.cuda.empty_cache()

    # Обучаем модель
    trainer.train()

    # Сохраняем модель и токенизатор
    model.save_pretrained("/home/crossovka/code/react/hahaton cody/python-server/nero/judicial_model")
    tokenizer.save_pretrained("/home/crossovka/code/react/hahaton cody/python-server/nero/judicial_model")
    print("Модель и токенизатор сохранены на диск /home/crossovka/code/react/hahaton cody/python-server/nero/judicial_model")

    # Сохраняем label_map для использования в process_document.py
    with open("/home/crossovka/code/react/hahaton cody/python-server/nero/judicial_model/label_map.json", "w", encoding="utf-8") as f:
        json.dump(label_map, f, ensure_ascii=False, indent=4)


# Основная функция
def main():
    # Подготовка данных для обучения
    training_examples = prepare_training_data(
        labeled_folder="training_data",  # Папка с 15 размеченными документами
        unlabeled_folder="unlabeled_data"  # Папка с 500 обычными документами
    )

    # Дообучение модели
    fine_tune_model(training_examples)


if __name__ == "__main__":
    main()