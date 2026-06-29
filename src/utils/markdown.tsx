// src/utils/markdown.tsx
import { type Components } from 'react-markdown';
import type { ReactNode } from 'react';

type CodeComponentProps = {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
};

export const markdownComponents: Components = {
  pre: ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-2">
      {children}
    </pre>
  ),
  code: ({ inline, className, children }: CodeComponentProps) => {
    if (inline) {
      return (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </table>
    </div>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
      {children}
    </blockquote>
  ),
};

export const markdownPlugins = ['remarkGfm', 'rehypeHighlight'] as const;