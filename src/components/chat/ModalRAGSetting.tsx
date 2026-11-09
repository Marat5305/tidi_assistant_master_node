// ModalRAGSetting.tsx
import { useEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import {
    useChatStore

} from '../../store/chatStore';
const MAX_FILES = 10;

interface ModalRAGSettingProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ModalRAGSetting = ({
    isOpen,
    onClose,
}: ModalRAGSettingProps): JSX.Element | null => {
    // берём только метод, без флагов модалки из стора
    const createRAG = useChatStore((s) => s.createRAG);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // сброс при открытии
    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setFiles([]);
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Escape / скролл / фокус
    useEffect(() => {
        if (!isOpen) return;
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                event.stopPropagation();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modalRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
            previouslyFocusedRef.current?.focus();
        };
    }, [isOpen, onClose, isSubmitting]);

    if (!isOpen) return null;

    const addFiles = (incoming: FileList | File[]) => {
        setError(null);
        const list = Array.from(incoming);
        setFiles((prev) => {
            const room = MAX_FILES - prev.length;
            if (room <= 0) {
                setError(`Максимум ${MAX_FILES} файлов`);
                return prev;
            }
            const merged = [...prev, ...list.slice(0, room)];
            if (list.length > room) {
                setError(`Добавлены первые ${room} файлов (лимит ${MAX_FILES})`);
            }
            return merged;
        });
    };

    const removeFile = (index: number) =>
        setFiles((prev) => prev.filter((_, i) => i !== index));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Укажите название');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await createRAG(
            name.trim(),
            description.trim() || null,
            files,
        );

        setIsSubmitting(false);

        if (result.ok) {
            onClose();
            // если в приложении есть список наборов — обновите его здесь:
            // await refreshRagSets();
        } else {
            setError(result.error);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
            role="presentation"
        >
            <div
                ref={modalRef}
                className="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl outline-none"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                        Создать RAG-набор
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Закрыть"
                        className="rounded-md p-1 text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                    >
                        ×
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название набора"
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
                    />
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание"
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100"
                    />

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Файлы ({files.length}/{MAX_FILES})
                        </span>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting || files.length >= MAX_FILES}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                        >
                            Добавить
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileChange}
                            disabled={isSubmitting || files.length >= MAX_FILES}
                        />
                    </div>

                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => !isSubmitting && fileInputRef.current?.click()}
                        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50/40"
                    >
                        Перетащите файлы сюда или нажмите для выбора
                    </div>

                    {files.length > 0 && (
                        <ul className="max-h-40 space-y-2 overflow-y-auto">
                            {files.map((file, index) => (
                                <li
                                    key={`${file.name}-${file.size}-${index}`}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                                >
                                    <span className="truncate text-gray-800">{file.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {Math.round(file.size / 1024)} KB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            disabled={isSubmitting}
                                            aria-label="Удалить"
                                            className="text-gray-500 transition hover:text-red-600 disabled:opacity-50"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="mt-2 flex justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Отправка…' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default ModalRAGSetting;