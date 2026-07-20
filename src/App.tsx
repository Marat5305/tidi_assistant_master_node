/* eslint-disable react-hooks/set-state-in-effect */
// src/App.tsx
import { useEffect, useState } from 'react';
import { AuthMock } from './components/auth/AuthMock';
import { useUserStore } from './store/userStore';
import { ThreadSidebar } from './components/chat/ThreadSidebar';
import { ChatContainer } from './components/chat/ChatContainer';
import { AgentSidebar } from './components/chat/AgentSidebar';

function App() {
  // Берём пользователя из стора
  const user = useUserStore((state) => state.user);
  
  // Локальное состояние — показан ли чат
  const [showChat, setShowChat] = useState(false);
  
  // Проверяем флаг разработки
  const isDev = import.meta.env.DEV;
  const skipAuth = localStorage.getItem('rag_skip_auth') === 'true';


  // Подписываемся на событие успешного входа
  useEffect(() => {
    const handleAuthSuccess = () => {
      setShowChat(true);
    };
    
    window.addEventListener('auth:success', handleAuthSuccess);
    return () => window.removeEventListener('auth:success', handleAuthSuccess);
  }, []);

  // Если есть флаг пропуска ИЛИ пользователь уже в сторе — показываем чат
  useEffect(() => {
    if ((skipAuth && isDev) || user?.email) {
      setShowChat(true);
    }
  }, [skipAuth, isDev, user]);

  // Если чат не показан — рисуем страницу входа
  if (!showChat) {
    return <AuthMock />;
  }

  // Иначе — основной чат
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <ThreadSidebar />
      <ChatContainer />
      <AgentSidebar />
    </div>
  );
}

export default App;