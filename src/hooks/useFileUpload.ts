// src/hooks/useFileUpload.ts
import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';
import type { FileAttachment } from '../types/chat';
import { generateId } from '../utils/id';

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

  const updateFileStatus = useCallback(
    (fileId: string, updates: Partial<FileAttachment>) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.id === fileId ? { ...f, ...updates } : f
        ),
      }));
    },
    []
  );

  const createAttachment = useCallback((file: File): FileAttachment => {
    return {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    };
  }, []);

  const uploadSingleFile = useCallback(
    async (attachment: FileAttachment, file: File) => {
      const abortController = new AbortController();
      abortControllersRef.current.set(attachment.id, abortController);

      try {
        const result = await apiClient.uploadFile(file, (progress) => {
          updateFileStatus(attachment.id, { progress });
        });

        updateFileStatus(attachment.id, {
          status: 'uploaded',
          url: result.url,
          progress: 100,
        });
      } catch (error: unknown) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          updateFileStatus(attachment.id, { status: 'error' });
        } else {
          updateFileStatus(attachment.id, { status: 'error' });
        }
      } finally {
        abortControllersRef.current.delete(attachment.id);
      }
    },
    [updateFileStatus]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const attachments = newFiles.map(createAttachment);

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...attachments],
      }));

      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        const file = newFiles[i];
        void uploadSingleFile(attachment, file);
      }
    },
    [createAttachment, uploadSingleFile]
  );

  const removeFile = useCallback((fileId: string) => {
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
    }

    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
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
    [setDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    },
    [setDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles, setDragging]
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