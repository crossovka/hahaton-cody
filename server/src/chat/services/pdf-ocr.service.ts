import { Injectable } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { fromBuffer } from 'pdf2pic';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class PdfOcrService {
  async parsePdf(fileBuffer: Buffer, originalName?: string): Promise<string[]> {
    if (!fileBuffer) {
      throw new Error('Empty file buffer');
    }

    console.log(`📄 Received file: ${originalName || 'Unnamed'}`);
    let extractedText = '';

    try {
      console.log('📥 Attempting to extract text directly from PDF...');
      extractedText = (await pdf(fileBuffer)).text;

      // If text is found, format it
      if (extractedText.trim().length > 10) {
        console.log('📄 Text found directly in PDF. OCR not needed.');
        return this.formatExtractedText(extractedText);
      }

      console.log('❗ Direct text is too short, proceeding with OCR...');
    } catch (err) {
      console.warn('⚠️ Failed to parse PDF directly. Proceeding with OCR...');
      console.error('🔥 PDF parsing error:', err.message || err);
    }

    // OCR fallback
    try {
      const images = await this.convertPdfToImages(fileBuffer);
      console.log(`🖼️ Converted pages: ${images.length}`);

      const texts: string[] = [];
      const worker = await createWorker();

      await worker.reinitialize('eng+rus');

      for (let i = 0; i < images.length; i++) {
        const imagePath = images[i];
        const preprocessed = await this.preprocessImage(imagePath);

        const {
          data: { text },
        } = await worker.recognize(preprocessed);

        // Add text only if it exists
        if (text.trim()) {
          const pageText = `Страница ${i + 1}:\n${this.cleanText(text.trim())}`;
          texts.push(pageText);
        } else {
          // If the page is empty, add a placeholder with the correct page number
          texts.push(`Страница ${i + 1}:\n`);
        }

        await fs.unlink(preprocessed);
      }

      await worker.terminate();
      console.log('✅ OCR completed');
      return texts; // Return all pages, including empty ones if necessary
    } catch (err) {
      console.error('🔥 OCR error:', err.message || err);
      return this.formatExtractedText(extractedText); // Fallback to direct text if OCR fails
    }
  }

  // Function to format the extracted text
  private formatExtractedText(text: string): string[] {
    const pages = text.split(/\n\s*\n/); // Split by double line breaks

    return pages
      .map((page, index) => {
        const pageText = this.cleanText(page);
        if (!pageText.trim() && index === 0) {
          // For the first page, ensure it has a label even if empty
          return `Страница ${index + 1}:\n`;
        }
        if (!pageText.trim()) {
          return ''; // Skip empty pages
        }
        return `Страница ${index + 1}:\n${pageText}`;
      })
      .filter((page) => page.trim()); // Remove empty pages
  }

  // Clean the text from unnecessary characters and spaces
  private cleanText(text: string): string {
    return text
      .replace(/\n+/g, '\n') // Replace multiple line breaks with a single one
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/^ /, '') // Remove space at the beginning
      .replace(/ $/, '') // Remove space at the end
      .replace(/ {2,}/g, ' ') // Replace multiple spaces with a single space
      .trim(); // Trim spaces at the ends
  }

  private async convertPdfToImages(fileBuffer: Buffer): Promise<string[]> {
    // Convert PDF to images (each page)
    const pdf2img = require('pdf2img');
    return new Promise((resolve, reject) => {
      pdf2img.setOptions({
        type: 'png',
        size: 1024,
        density: 600,
      });

      pdf2img.convert(fileBuffer, (err: any, pages: any[]) => {
        if (err) {
          reject('Error converting PDF to images');
        } else {
          resolve(pages.map((page) => page.path));
        }
      });
    });
  }

  private async preprocessImage(imagePath: string): Promise<string> {
    // Here you can preprocess the image before OCR (e.g., enhance contrast)
    return imagePath; // Return the path for OCR
  }
}