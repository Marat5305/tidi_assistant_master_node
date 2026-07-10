// src/config/ocr.ts

// Типы для поддерживаемых MIME-типов
export type SupportedMimeType = 
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf';

// Типы для поддерживаемых расширений
export type SupportedExtension = 
  | '.png'
  | '.jpg'
  | '.jpeg'
  | '.gif'
  | '.webp'
  | '.pdf';

export const OCR_CONFIG = {
  // ID агента OCR в мастер-роутере
  agentId: 'ocr',
  
  // Максимальный размер файла (20MB согласно документации)
  maxFileSize: 20 * 1024 * 1024, // 20MB в байтах
  
  // Поддерживаемые MIME-типы
  supportedTypes: [
    'image/png',
    'image/jpeg', 
    'image/gif',
    'image/webp',
    'application/pdf'
  ] as const satisfies readonly SupportedMimeType[],
  
  // Поддерживаемые расширения (для дополнительной проверки)
  supportedExtensions: [
    '.png', 
    '.jpg', 
    '.jpeg', 
    '.gif', 
    '.webp', 
    '.pdf'
  ] as const satisfies readonly SupportedExtension[],
  
  // Человекочитаемый список для сообщений об ошибках
  supportedFormatsText: 'изображения (PNG, JPG, WEBP, GIF) и PDF'
} as const;

// Type guard для проверки MIME-типа
function isSupportedMimeType(type: string): type is SupportedMimeType {
  return OCR_CONFIG.supportedTypes.includes(type as SupportedMimeType);
}

// Type guard для проверки расширения
function isSupportedExtension(ext: string): ext is SupportedExtension {
  return OCR_CONFIG.supportedExtensions.includes(ext as SupportedExtension);
}

// Вспомогательная функция для проверки поддержки файла
export function isFileSupported(file: File): boolean {
  // Проверяем по MIME-типу
  if (isSupportedMimeType(file.type)) {
    return true;
  }
  
  // Дополнительная проверка по расширению (на случай неправильного MIME)
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext) {
    const extWithDot = `.${ext}` as const;
    if (isSupportedExtension(extWithDot)) {
      return true;
    }
  }
  
  return false;
}

// Вспомогательная функция для валидации файла
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Проверка размера
  if (file.size > OCR_CONFIG.maxFileSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Файл "${file.name}" (${sizeMB} MB) превышает лимит ${OCR_CONFIG.maxFileSize / (1024 * 1024)} MB`
    };
  }
  
  // Проверка поддержки
  if (!isFileSupported(file)) {
    return {
      valid: false,
      error: `Файл "${file.name}" не поддерживается. Поддерживаются: ${OCR_CONFIG.supportedFormatsText}`
    };
  }
  
  return { valid: true };
}