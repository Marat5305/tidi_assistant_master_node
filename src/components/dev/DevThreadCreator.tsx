// // src/components/dev/DevThreadCreator.tsx
// import { useChatStore } from '../../store/chatStore';
// import { generateId } from '../../utils/id';

// /**
//  * DEV-компонент для создания тредов с разными датами
//  * Удалить перед продакшеном
//  */
// export function DevThreadCreator() {
//   const threads = useChatStore((state) => state.threads);
  
//   // Только в development режиме
//   if (import.meta.env.MODE !== 'development') {
//     return null;
//   }

//   const addThreadWithDate = (daysAgo: number, title: string) => {
//     const date = new Date();
//     date.setDate(date.getDate() - daysAgo);
    
//     const newThread = {
//       id: generateId(),
//       title: title,
//       lastMessage: `Тестовое сообщение от ${date.toLocaleDateString()}`,
//       messages: [],
//       createdAt: date.getTime(),
//       updatedAt: date.getTime(),
//     };
    
//     // Добавляем напрямую в store (временно, пока нет API)
//     useChatStore.setState((state) => ({
//       threads: [newThread, ...state.threads],
//       activeThreadId: newThread.id,
//     }));
//   };

//   return (
//     <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
//       <div className="font-bold mb-2 text-[var(--color-accent)]">DEV: Тест группировки</div>
//       <div className="space-y-1">
//         <button 
//           onClick={() => addThreadWithDate(0, 'Чат сегодня')}
//           className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
//         >
//           📅 Сегодня
//         </button>
//         <button 
//           onClick={() => addThreadWithDate(1, 'Чат вчера')}
//           className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
//         >
//           📅 Вчера
//         </button>
//         <button 
//           onClick={() => addThreadWithDate(3, 'Чат 3 дня назад')}
//           className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
//         >
//           📅 На этой неделе
//         </button>
//         <button 
//           onClick={() => addThreadWithDate(10, 'Чат 10 дней назад')}
//           className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
//         >
//           📅 Ранее
//         </button>
//         <hr className="my-2" />
//         <div className="text-gray-500">Всего тредов: {threads.length}</div>
//       </div>
//     </div>
//   );
// }