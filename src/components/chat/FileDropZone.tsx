import { useState, useRef, useCallback, type DragEvent, type ClipboardEvent, type ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  children: ReactNode;
  onFilesSelected?: (files: File[]) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = [
  // PDF
  'application/pdf',
  
  // Microsoft Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  // LibreOffice / OpenOffice Writer
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.text-template',
  
  // Microsoft Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  
  // LibreOffice / OpenOffice Calc
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.spreadsheet-template',
  
  // CSV (часто используют с Excel)
  'text/csv',
  'text/tab-separated-values',
  
  // Текстовые
  'text/plain',
  
  // Изображения
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export function FileDropZone({ children, onFilesSelected }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Файл "${file.name}" слишком большой (макс. 50 МБ)`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Неподдерживаемый тип файла: ${file.type || 'неизвестный'}`);
        continue;
      }
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const processFiles = useCallback((files: File[]) => {
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      // Файлы готовы к загрузке
      onFilesSelected?.(validFiles);
      setError(null);
    }
  }, [onFilesSelected]);

  // Drag events
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
      setError(null);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Clipboard paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {children}

      {/* Оверлей при перетаскивании */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-4 border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-2 text-[var(--color-accent)]">
            <Upload size={40} />
            <span className="text-sm font-medium">Прикрепить файлы</span>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="absolute -top-12 left-0 right-0 z-50 mx-auto w-fit px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg shadow-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 font-bold hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}