// // src/hooks/useStreamingMessage.ts
// import { useCallback, useRef } from 'react';
// import { useChatStore } from '../store/chatStore';
// import { streamChat } from '../services/api';
// import type { Message, Citation } from '../types/chat';
// import { generateId } from '../utils/id';

// // Простой парсер для стриминга (заменяет StreamParser)
// class SimpleStreamParser {
//   private buffer = '';

//   reset() {
//     this.buffer = '';
//   }

//   parse(chunk: string): Array<{ type: 'text' | 'citation' | 'error' | 'done'; content?: string; citation?: Citation; error?: string }> {
//     const results: Array<{ type: 'text' | 'citation' | 'error' | 'done'; content?: string; citation?: Citation; error?: string }> = [];
    
//     this.buffer += chunk;
//     const lines = this.buffer.split('\n');
//     this.buffer = lines.pop() || '';

//     for (const line of lines) {
//       const trimmed = line.trim();
//       if (!trimmed) continue;

//       // Обработка SSE формата
//       if (trimmed.startsWith('data: ')) {
//         const data = trimmed.slice(6);
//         if (data === '[DONE]') {
//           results.push({ type: 'done' });
//           continue;
//         }

//         try {
//           const parsed = JSON.parse(data);
//           if (parsed.content) {
//             results.push({ type: 'text', content: parsed.content });
//           }
//           if (parsed.citation) {
//             results.push({ type: 'citation', citation: parsed.citation });
//           }
//           if (parsed.error) {
//             results.push({ type: 'error', error: parsed.error });
//           }
//         } catch {
//           // Если не JSON, отдаем как текст
//           results.push({ type: 'text', content: data });
//         }
//       } 
//       // Обработка plain text
//       else {
//         results.push({ type: 'text', content: trimmed });
//       }
//     }

//     return results;
//   }
// }

// export function useStreamingMessage() {
//   const abortControllerRef = useRef<AbortController | null>(null);
//   const streamParserRef = useRef<SimpleStreamParser>(new SimpleStreamParser());

//   // Получаем состояние и действия из store
//   const agentId = useChatStore((state) => state.agentId);
//   const currentSessionId = useChatStore((state) => state.currentSessionId);
//   // const messages = useChatStore((state) => state.messages);
//   const isStreaming = useChatStore((state) => state.isStreaming);
  
//   const setStreaming = useChatStore((state) => state.setStreaming);
//   const setError = useChatStore((state) => state.setError);
//   const setCitations = useChatStore((state) => state.setCitations);
//   const setIsLoading = useChatStore((state) => state.setIsLoading);
//   const appendToStreamingMessage = useChatStore((state) => state.set);
//   const finalizeStreamingMessage = useChatStore((state) => state.finalizeStreamingMessage);
//   const addMessage = useChatStore((state) => state.addMessage);
  
//   // Добавляем недостающие методы в store или используем существующие
//   // Если нет setIsLoading, используем isLoading напрямую
//   const setIsLoading = useChatStore((state) => state.setIsLoading || ((val: boolean) => {}));

//   const createUserMessage = (
//     sessionId: string,
//     content: string
//   ): Message => ({
//     id: generateId(),
//     threadId: sessionId,
//     sessionId: sessionId,
//     role: 'user',
//     content,
//     timestamp: Date.now(),
//     created_at: new Date().toISOString(),
//     status: 'sent',
//   });

//   const createAssistantMessage = (
//     sessionId: string,
//     content: string,
//     citations: Citation[]
//   ): Message => ({
//     id: generateId(),
//     threadId: sessionId,
//     sessionId: sessionId,
//     role: 'assistant',
//     content,
//     citations: citations.length > 0 ? citations : undefined,
//     timestamp: Date.now(),
//     created_at: new Date().toISOString(),
//     status: 'sent',
//   });

//   const sendMessage = useCallback(
//     async (content: string, context?: any) => {
//       // Проверяем наличие agentId и sessionId
//       if (!agentId) {
//         setError('Agent ID не установлен');
//         return;
//       }

//       if (!currentSessionId) {
//         setError('Сессия не выбрана');
//         return;
//       }

//       if (content.trim().length === 0) {
//         return;
//       }

//       // Создаем сообщение пользователя
//       const userMessage = createUserMessage(currentSessionId, content);
//       addMessage(userMessage);

//       // Устанавливаем состояние стриминга
//       setStreaming(true);
//       setIsLoading(true);
//       setError(null);

//       // Сбрасываем парсер
//       streamParserRef.current.reset();

//       // Создаем AbortController для возможности остановки
//       const abortController = new AbortController();
//       abortControllerRef.current = abortController;

//       let streamedContent = '';
//       const collectedCitations: Citation[] = [];

//       try {
//         // Используем новый streamChat с параметрами agentId, sessionId
//         const generator = streamChat(
//           agentId,
//           currentSessionId,
//           content,
//           context,
//           abortController.signal
//         );

//         for await (const chunk of generator) {
//           // Парсим чанк
//           const parsedChunks = streamParserRef.current.parse(chunk);

//           for (const parsed of parsedChunks) {
//             switch (parsed.type) {
//               case 'text': {
//                 if (parsed.content) {
//                   streamedContent += parsed.content;
//                   appendToStreamingMessage(parsed.content);
//                 }
//                 break;
//               }

//               case 'citation': {
//                 if (parsed.citation) {
//                   collectedCitations.push(parsed.citation);
//                 }
//                 break;
//               }

//               case 'error': {
//                 throw new Error(parsed.error ?? 'Unknown stream error');
//               }

//               case 'done': {
//                 // Создаем финальное сообщение ассистента
//                 const assistantMessage = createAssistantMessage(
//                   currentSessionId,
//                   streamedContent,
//                   collectedCitations
//                 );
//                 finalizeStreamingMessage(assistantMessage);

//                 if (collectedCitations.length > 0) {
//                   setCitations(collectedCitations);
//                 }
//                 break;
//               }
//             }
//           }
//         }

//         // Если стриминг завершился без события 'done'
//         if (streamedContent.length > 0 && !isStreaming) {
//           const assistantMessage = createAssistantMessage(
//             currentSessionId,
//             streamedContent,
//             collectedCitations
//           );
//           finalizeStreamingMessage(assistantMessage);

//           if (collectedCitations.length > 0) {
//             setCitations(collectedCitations);
//           }
//         }
//       } catch (error: unknown) {
//         // Обработка ошибок
//         if (error instanceof DOMException && error.name === 'AbortError') {
//           // Пользователь остановил генерацию
//           if (streamedContent.length > 0) {
//             const assistantMessage = createAssistantMessage(
//               currentSessionId,
//               `${streamedContent}\n\n[Генерация сообщения остановлена]`,
//               collectedCitations
//             );
//             finalizeStreamingMessage(assistantMessage);
//           }
//         } else {
//           const errorMessage =
//             error instanceof Error ? error.message : 'Ошибка отправки сообщения';
//           setError(errorMessage);
//           setStreaming(false);
          
//           // Добавляем сообщение об ошибке в чат
//           const errorMessageObj: Message = {
//             id: generateId(),
//             threadId: currentSessionId,
//             sessionId: currentSessionId,
//             role: 'assistant',
//             content: `❌ Ошибка: ${errorMessage}`,
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'error'
//           };
//           addMessage(errorMessageObj);
//         }
//       } finally {
//         setIsLoading(false);
//         abortControllerRef.current = null;
//       }
//     },
//     [
//       agentId,
//       currentSessionId,
//       addMessage,
//       appendToStreamingMessage,
//       finalizeStreamingMessage,
//       setStreaming,
//       setCitations,
//       setError,
//       setIsLoading,
//       isStreaming,
//     ]
//   );

//   const stopStreaming = useCallback(() => {
//     const controller = abortControllerRef.current;
//     if (controller) {
//       controller.abort();
//       abortControllerRef.current = null;
//       setStreaming(false);
//       setIsLoading(false);
//     }
//   }, [setStreaming, setIsLoading]);

//   const isStreamingActive = useChatStore((state) => state.isStreaming);

//   return {
//     sendMessage,
//     stopStreaming,
//     isStreaming: isStreamingActive,
//   };
// }