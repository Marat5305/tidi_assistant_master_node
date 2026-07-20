import { useState, useRef, useCallback, type DragEvent, type ClipboardEvent, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { validateFile } from '../../config/ocr';

interface FileDropZoneProps {
  children: ReactNode;
}

export function FileDropZone({ children }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);
  
  // Получаем методы из стора
  const { addFile, isStreaming } = useChatStore();

  const processFiles = useCallback((files: File[]) => {
    let hasError = false;
    
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Файл не поддерживается');
        hasError = true;
        continue;
      }
      
      // Добавляем файл в стор
      addFile(file);
    }
    
    // Если все файлы прошли валидацию, очищаем ошибку
    if (!hasError) {
      setError(null);
    }
  }, [addFile]);

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

    if (isStreaming) {
      setError('Нельзя загружать файлы во время генерации ответа');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles, isStreaming]);

  // Clipboard paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isStreaming) {
      setError('Нельзя загружать файлы во время генерации ответа');
      return;
    }

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
  }, [processFiles, isStreaming]);

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