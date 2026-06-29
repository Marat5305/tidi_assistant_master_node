/**
 * @component AuthMock
 * @path src/components/auth/AuthMock.tsx
 * @description Временная страница входа/регистрации в стиле проекта.
 */

import { useState } from 'react';
import logo from '../../assets/logo.svg';
import { useUserStore } from '../../store/userStore';

export function AuthMock() {
  // Состояния для полей формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skipAuth, setSkipAuth] = useState(false);
  
  // Признак разработки (чтобы галочка показывалась только в dev-режиме)
  const isDev = import.meta.env.DEV;

  // Обработчик входа
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Получаем функцию updateUser из стора
    const updateUser = useUserStore.getState().updateUser;
    
    // Сохраняем пользователя в стор (моковые данные)
    updateUser({
        name: email.split('@')[0], // берём имя из email (часть до @)
        email: email,
        department: 'Тестовый отдел',
    });
    
    // Если галочка стояла И это режим разработки — сохраняем флаг в localStorage
    if (skipAuth && isDev) {
        localStorage.setItem('rag_skip_auth', 'true');
        console.log('[DEV] Флаг сохранён: rag_skip_auth = true');
    }
    
    console.log('Пользователь вошёл:', { email, name: email.split('@')[0] });
    
    // Диспатчим событие, которое поймает App.tsx
    window.dispatchEvent(new CustomEvent('auth:success'));
    };

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-full max-w-md p-8 rounded-xl border border-[var(--color-accent)] bg-white dark:bg-gray-900 shadow-sm">
        {/* Заголовок — оставляем твой */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex gap-1 items-end justify-center">
            <img src={logo} alt="Логотип" className="h-8 w-auto" />
            <h2 className="text-2xl font-bold italic tracking-wide text-gradient-logo">тиди</h2>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Добро пожаловать
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Войдите в систему, чтобы продолжить
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
            required
          />
          
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
            required
          />
          
          {/* Галочка — показываем только в режиме разработки */}
          {isDev && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipAuth}
                onChange={(e) => setSkipAuth(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Не показывать окно входа (только для разработки)
              </span>
            </label>
          )}
          
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-all font-medium"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}