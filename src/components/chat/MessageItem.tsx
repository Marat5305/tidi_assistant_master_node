// // src/components/chat/MessageItem.tsx
// import type { Message } from '../../types/chat';

// interface MessageItemProps {
//   message: Message;
//   onCitationClick?: (citationId: string) => void;
//   activeCitationId?: string | null;
// }

// export function MessageItem({ message, onCitationClick, activeCitationId }: MessageItemProps) {
//   const isUser = message.role === 'user';

//   // Подсветка цитат в тексте
//   const renderContent = (content: string) => {
//     if (!message.citations || message.citations.length === 0) return content;

//     const parts = content.split(/(\[citation:\d+\])/g);
    
//     return parts.map((part, index) => {
//       const match = part.match(/\[citation:(\d+)\]/);
//       if (match) {
//         const citationNumber = parseInt(match[1]);
//         const citation = message.citations?.find(c => c.number === citationNumber);
//         const isActive = citation?.id === activeCitationId;

//         return (
//           <button
//             key={index}
//             onClick={() => citation && onCitationClick?.(citation.id)}
//             className={`
//               inline-flex items-center px-1 rounded transition-all
//               ${isActive 
//                 ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold' 
//                 : 'bg-[var(--color-accent)]/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/15'
//               }
//             `}
//           >
//             [{citationNumber}]
//           </button>
//         );
//       }
//       return <span key={index}>{part}</span>;
//     });
//   };

//   return (
//     <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
//       <div
//         className={`
//           max-w-[70%] rounded-lg px-4 py-2 mx-6 border 
//           ${isUser 
//             ? 'bg-[var(--color-surface)] border-[var(--color-accent)] text-black' 
//             : 'bg-white dark:bg-gray-700 border-[var(--color-surface)] shadow-sm text-gray-900 dark:text-white'
//           }
//         `}
//       >
//         {renderContent(message.content)}
//       </div>
//     </div>
//   );
// }

// src/components/chat/MessageItem.tsx
import type { Message } from '../../types/chat';

interface MessageItemProps {
  message: Message;
  onCitationClick?: (citationId: string) => void;
  activeCitationId?: string | null;
}

export function MessageItem({ message, onCitationClick, activeCitationId }: MessageItemProps) {
  const isUser = message.role === 'user';

  // Подсветка цитат в тексте
  const renderContent = (content: string) => {
    if (!message.citations || message.citations.length === 0) return content;

    const parts = content.split(/(\[source:\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[citation:(\d+)\]/);
      if (match) {
        const citationNumber = parseInt(match[1]);
        const citation = message.citations?.find(c => c.number === citationNumber);
        const isActive = citation?.id === activeCitationId;

        return (
          <button
            key={index}
            onClick={() => citation && onCitationClick?.(citation.id)}
            className={`
              inline-flex items-center px-1 rounded transition-all
              ${isActive 
                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold' 
                : 'bg-[var(--color-accent)]/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/15'
              }
            `}
          >
            [{citationNumber}]
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[70%] rounded-lg px-4 py-2 mx-6 border 
          ${isUser 
            ? 'bg-[var(--color-surface)] border-[var(--color-accent)] text-black' 
            : 'bg-white dark:bg-gray-700 border-[var(--color-surface)] shadow-sm text-gray-900 dark:text-white'
          }
        `}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}