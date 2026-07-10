import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { ArrowUp, Paperclip, Mic } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { validateFile } from '../../config/ocr';

export function InputArea() {
  const [input, setInput] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    smartChatStream, 
    isMasterMode, 
    isStreaming,
    error,
    uploadingFiles = [],
    removeFile,
    addFile,
  } = useChatStore();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 220;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const hasProcessingFiles = uploadingFiles.some(
    f => f.status === 'uploading' || f.status === 'processing'
  );

  const handleSend = async () => {
    if (isStreaming) return;
    if (hasProcessingFiles) {
      console.warn('Дождитесь завершения загрузки файлов');
      return;
    }
    if (!input.trim() && uploadingFiles.length === 0) return;

    const message = input.trim();
    setInput('');
    
    try {
      if (message) {
        await smartChatStream(message);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setInput(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        console.error(validation.error);
        continue;
      }
      addFile(file);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    removeFile(fileId);
  };

  const canSend = !isStreaming && !hasProcessingFiles && (!!input.trim() || uploadingFiles.length > 0);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {error && (
        <div className="text-sm text-red-500 mb-2">
          ❌ {error}
        </div>
      )}
      
      {isStreaming && (
        <div className="text-sm text-blue-500 mb-2 animate-pulse">
          ⏳ Генерация ответа...
        </div>
      )}

      {/* Список загружаемых файлов */}
      {uploadingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {uploadingFiles.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={handleRemoveFile}
              disabled={isStreaming || file.status === 'uploading' || file.status === 'processing'}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          {isMasterMode && input.length === 0 && uploadingFiles.length === 0 && !isStreaming && (
            <div 
              className={`
                absolute -inset-1.5 rounded-2xl transition-all duration-500
                ${!isHovered ? 'animate-pulse opacity-70' : 'opacity-100'}
              `}
              style={{
                background: 'linear-gradient(90deg, #0abab5, #158683, #0abab5, #158683)',
                backgroundSize: '300% 100%',
                filter: 'blur(8px)',
                animation: 'gradientFlow 3s ease infinite',
              }}
            />
          )}
          <div
            className={`
              relative w-full flex items-start gap-4 bg-white rounded-2xl border-2 
              dark:bg-gray-800 px-4 py-2 transition-all z-10
              ${isStreaming 
                ? 'border-gray-300 dark:border-gray-600' 
                : 'border-[var(--color-accent)]'
              }
            `}
          >
            {/* Кнопка прикрепления файла */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[var(--color-accent)] hover:text-[var(--color-hover)] transition-colors cursor-pointer flex-shrink-0 mt-2 disabled:opacity-50"
              aria-label="Прикрепить файл"
              disabled={isStreaming || hasProcessingFiles}
              title={hasProcessingFiles ? "Дождитесь завершения загрузки" : "Прикрепить файл"}
            >
              <Paperclip size={20} />
            </button>

            {/* Скрытый input для выбора файлов */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isStreaming || hasProcessingFiles}
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              placeholder={
                isStreaming 
                  ? "Ожидание ответа..." 
                  : hasProcessingFiles 
                    ? "Загрузка файлов..." 
                    : "Напишите сообщение... (Enter — отправить)"
              }
              className="flex-1 rounded-lg bg-white dark:bg-gray-700 p-2 resize-none overflow-y-auto focus:outline-none focus:ring-0 disabled:opacity-50"
              rows={1}
              disabled={isStreaming || hasProcessingFiles}
              style={{
                maxHeight: '220px',
                lineHeight: '1.5',
              }}
            />
            
            <button
              className="text-[var(--color-accent)] hover:text-[var(--color-hover)] transition-colors cursor-pointer flex-shrink-0 mt-2 disabled:opacity-50"
              aria-label="Голосовое сообщение"
              disabled={isStreaming}
            >
              <Mic size={20} />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            w-10 h-10 rounded-full text-white flex items-center justify-center 
            transition-all hover:scale-105 self-end mb-3 flex-shrink-0
            ${!canSend 
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-hover)]'
            }
          `}
          aria-label="Отправить сообщение"
        >
          {isStreaming ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowUp size={20} />
          )}
        </button>
      </div>
    </div>
  );
}