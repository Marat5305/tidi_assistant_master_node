import { FileIcon, X, Loader2, CheckCircle, AlertCircle, Image, FileText } from 'lucide-react';
import type { FileAttachment } from '../../types/chat';

interface FilePreviewProps {
  file: FileAttachment;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return `Загрузка ${file.progress}%`;
      case 'processing':
        return 'Распознавание...';
      case 'completed':
        return 'Готово';
      case 'error':
        return file.error || 'Ошибка';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isProcessing = file.status === 'uploading' || file.status === 'processing';
  const canRemove = !isProcessing && !disabled;

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
      ${getStatusColor()}
      ${isProcessing ? 'animate-pulse' : ''}
    `}>
      {/* Иконка файла */}
      {getFileIcon()}

      {/* Информация о файле */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{file.name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatFileSize(file.size)}
          </span>
          {getStatusIcon()}
        </div>
        
        {/* Прогресс загрузки */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="w-full h-1 mt-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Статус или извлеченный текст */}
        {file.status === 'completed' && file.extractedText && (
          <div className="text-xs text-green-600 truncate mt-0.5">
            ✓ Распознано: {file.extractedText.slice(0, 60)}...
          </div>
        )}

        {file.status === 'error' && file.error && (
          <div className="text-xs text-red-500 truncate mt-0.5">
            ❌ {file.error}
          </div>
        )}

        {file.status !== 'completed' && file.status !== 'error' && (
          <div className="text-xs text-gray-500 mt-0.5">
            {getStatusText()}
          </div>
        )}
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={() => onRemove(file.id)}
        disabled={!canRemove}
        className={`
          p-1 rounded-full transition-colors flex-shrink-0
          ${canRemove 
            ? 'hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
        `}
        aria-label="Удалить файл"
        title={canRemove ? 'Удалить файл' : 'Нельзя удалить во время загрузки'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}