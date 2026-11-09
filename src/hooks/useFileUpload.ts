// src/hooks/useFileUpload.ts
import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';
import type { FileAttachment } from '../types/chat';
import { generateId } from '../utils/id';
import { validateFile } from '../config/ocr';

interface UploadState {
  files: FileAttachment[];
  isDragging: boolean;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    files: [],
    isDragging: false,
  });

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const updateAttachment = useCallback(
    (attachmentId: string, updates: Partial<FileAttachment>) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.id === attachmentId ? { ...f, ...updates } : f,
        ),
      }));
    },
    [],
  );

  const createAttachment = useCallback((file: File): FileAttachment => {
    return {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'processing',
      progress: 0,
      file,
    };
  }, []);

  const processSingleFile = useCallback(
    async (attachment: FileAttachment, file: File) => {
      const abortController = new AbortController();
      abortControllersRef.current.set(attachment.id, abortController);

      try {
        const text = await apiClient.ocrFile(
          file,
          (progress) => updateAttachment(attachment.id, { progress }),
          abortController.signal, // ocrFile принимает signal
        );

        updateAttachment(attachment.id, {
          status: 'completed',
          progress: 100,
          extractedText: text,
        });
      } catch (error: unknown) {
        const isAbort =
          error instanceof DOMException && error.name === 'AbortError';

        if (isAbort) {
          setState((prev) => ({
            ...prev,
            files: prev.files.filter((f) => f.id !== attachment.id),
          }));
        } else {
          const message =
            error instanceof Error ? error.message : 'Ошибка распознавания';
          updateAttachment(attachment.id, {
            status: 'error',
            error: message,
          });
        }
      } finally {
        abortControllersRef.current.delete(attachment.id);
      }
    },
    [updateAttachment],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const valid: File[] = [];
      for (const file of newFiles) {
        const result = validateFile(file);
        if (!result.valid) {
          console.warn(`⚠️ Файл ${file.name} отклонён:`, result.error);
          continue;
        }
        valid.push(file);
      }

      if (valid.length === 0) return;

      const attachments = valid.map(createAttachment);

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...attachments],
      }));

      for (let i = 0; i < attachments.length; i++) {
        void processSingleFile(attachments[i], valid[i]);
      }
    },
    [createAttachment, processSingleFile],
  );

  const removeFile = useCallback((attachmentId: string) => {
    const controller = abortControllersRef.current.get(attachmentId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(attachmentId);
    }

    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== attachmentId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current.clear();

    setState((prev) => ({ ...prev, files: [] }));
  }, []);

  const setDragging = useCallback((isDragging: boolean) => {
    setState((prev) => ({ ...prev, isDragging }));
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    },
    [setDragging],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    },
    [setDragging],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) addFiles(droppedFiles);
    },
    [addFiles, setDragging],
  );

  return {
    files: state.files,
    isDragging: state.isDragging,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}