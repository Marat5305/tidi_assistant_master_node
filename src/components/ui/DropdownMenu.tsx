/* eslint-disable react-refresh/only-export-components */
// src/components/ui/DropdownMenu.tsx
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';

// ---------- Корневой компонент ----------
// Просто реэкспорт Radix-корня для удобства импорта
export const DropdownMenu = DropdownMenuPrimitive.Root;

// ---------- Триггер ----------
// Обёртка над Trigger. asChild позволяет использовать нашу кнопку вместо дефолтной
export const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={className}
    {...props}
  />
));
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

// ---------- Контент (выпадашка) ----------
// Стилизованный контейнер меню с анимацией появления
export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={4}
      className={`
        z-50 min-w-[220px] rounded-lg border border-[var(--color-accent)]
        bg-white dark:bg-gray-800 p-1 shadow-lg
        animate-in fade-in-0 zoom-in-95
        data-[state=open]:animate-in
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

// ---------- Пункт меню ----------
// Отдельный элемент списка с ховер-эффектом
export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`
      relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm
      text-gray-700 dark:text-gray-200
      hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]
      focus:bg-[var(--color-surface)] focus:text-[var(--color-accent)]
      outline-none transition-colors
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className || ''}
    `}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

// ---------- Разделитель ----------
// Тонкая линия между группами пунктов
export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`-mx-1 my-1 h-px bg-[var(--color-surface)] ${className || ''}`}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';