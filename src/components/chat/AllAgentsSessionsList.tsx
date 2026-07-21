// // components/AllAgentsSessionsList.tsx
// import React, { useEffect, useState } from 'react';
// import { useChatStore } from '../../store/chatStore';
// import type { Session } from '../../types/chat';

// interface AgentsSessionsListProps {
//   onSessionSelect?: (agentName: string, session: Session) => void;
//   className?: string;
// }

// export const AllAgentsSessionsList: React.FC<AgentsSessionsListProps> = ({ 
//   onSessionSelect,
//   className = ''
// }) => {
//   const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
//   const [retryCount, setRetryCount] = useState(0);
//   const maxRetries = 5;
//   const retryDelay = 2000;
  
//   // Берем все нужное напрямую из стора
//   const { 
//     agents_list, 
//     getAllAgentsSessions,
//     isLoading,
//     error 
//   } = useChatStore();

//   // Загружаем сессии при монтировании с повторными попытками
//   useEffect(() => {
//     const fetchWithRetry = async () => {
//       try {
//         const list = await getAllAgentsSessions();
        
//         // Проверяем, есть ли сессии
//         const hasSessions = list?.some(
//           agent => agent.sessions && agent.sessions.length > 0
//         );
        
//         // Если нет сессий и не исчерпали попытки - повторяем
//         if (!hasSessions && retryCount < maxRetries) {
//           console.log(`🔄 Нет сессий, попытка ${retryCount + 1}/${maxRetries}`);
//           setRetryCount(prev => prev + 1);
//           setTimeout(() => {
//             fetchWithRetry();
//           }, retryDelay);
//         }
//       } catch (err) {
//         console.error('❌ Ошибка загрузки:', err);
//         if (retryCount < maxRetries) {
//           setRetryCount(prev => prev + 1);
//           setTimeout(() => {
//             fetchWithRetry();
//           }, retryDelay);
//         }
//       }
//     };

//     fetchWithRetry();
//   }, [retryCount]);

//   const toggleAgent = (agentName: string) => {
//     setExpandedAgents(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(agentName)) {
//         newSet.delete(agentName);
//       } else {
//         newSet.add(agentName);
//       }
//       return newSet;
//     });
//   };

//   // Проверяем, есть ли сессии
//   const agentsWithSessions = agents_list.filter(
//     agent => agent.sessions && agent.sessions.length > 0
//   );
  
//   const hasSessions = agentsWithSessions.length > 0;
//   const totalSessions = agentsWithSessions.reduce(
//     (total, agent) => total + agent.sessions.length, 
//     0
//   );

//   // Состояние загрузки
//   if (isLoading) {
//     return (
//       <div className={`p-4 ${className}`}>
//         <div className="animate-pulse space-y-3">
//           <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//           <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//           <div className="h-4 bg-gray-200 rounded w-2/3"></div>
//         </div>
//         <p className="text-gray-500 mt-3">
//           Загрузка сессий агентов...
//           {retryCount > 0 && ` (попытка ${retryCount}/${maxRetries})`}
//         </p>
//       </div>
//     );
//   }

//   // Ошибка
//   if (error) {
//     return (
//       <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
//         <div className="flex items-start">
//           <span className="text-red-500 text-xl mr-2">❌</span>
//           <div>
//             <p className="text-red-700 font-medium">Ошибка загрузки</p>
//             <p className="text-red-600 text-sm mt-1">{error}</p>
//           </div>
//         </div>
//         <button
//           onClick={() => {
//             setRetryCount(0);
//             getAllAgentsSessions();
//           }}
//           className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//         >
//           Повторить попытку
//         </button>
//       </div>
//     );
//   }

//   // Нет сессий
//   if (!hasSessions) {
//     return (
//       <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
//         <div className="flex items-start">
//           <span className="text-yellow-500 text-xl mr-2">⚠️</span>
//           <div>
//             <p className="text-yellow-700 font-medium">Нет доступных сессий</p>
//             <p className="text-yellow-600 text-sm mt-1">
//               Создайте новую сессию для начала работы с агентом
//             </p>
//             {retryCount >= maxRetries && (
//               <p className="text-yellow-600 text-xs mt-2">
//                 Превышено количество попыток загрузки
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Отображение сессий
//   return (
//     <div className={`space-y-4 ${className}`}>
//       <div className="flex justify-between items-center">
//         <h2 className="text-xl font-bold">Сессии агентов</h2>
//         <span className="text-sm text-gray-500">
//           Всего: {totalSessions} сессий
//         </span>
//       </div>
      
//       {agentsWithSessions.map((agent) => {
//         const isExpanded = expandedAgents.has(agent.agent_name);
        
//         return (
//           <div 
//             key={agent.agent_name} 
//             className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
//           >
//             {/* Заголовок агента */}
//             <button
//               onClick={() => toggleAgent(agent.agent_name)}
//               className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex items-center">
//                 <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
//                 <div className="text-left">
//                   <h3 className="font-semibold text-gray-800">
//                     {agent.agent_name}
//                   </h3>
//                   <p className="text-sm text-gray-500">
//                     {agent.sessions.length} {agent.sessions.length === 1 ? 'сессия' : 
//                      agent.sessions.length < 5 ? 'сессии' : 'сессий'}
//                   </p>
//                 </div>
//               </div>
//               <svg 
//                 className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
            
//             {/* Список сессий */}
//             {isExpanded && (
//               <div className="border-t border-gray-200">
//                 <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
//                   {agent.sessions.map((session) => (
//                     <div
//                       key={session.id}
//                       onClick={() => onSessionSelect?.(agent.agent_name, session)}
//                       className="p-3 pl-8 hover:bg-blue-50 cursor-pointer transition-colors"
//                     >
//                       <div className="flex justify-between items-start">
//                         <div className="flex-1">
//                           <p className="font-medium text-gray-700">
//                             {session.title || `Сессия ${session.id.slice(0, 8)}`}
//                           </p>
//                           <p className="text-xs text-gray-400 mt-1">
//                             ID: {session.id.slice(0, 8)}...
//                           </p>
//                         </div>
//                         <div className="text-xs text-gray-400 ml-2">
//                           {session.created_at && 
//                             new Date(session.created_at).toLocaleDateString('ru-RU', {
//                               day: 'numeric',
//                               month: 'short',
//                               hour: '2-digit',
//                               minute: '2-digit'
//                             })}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };