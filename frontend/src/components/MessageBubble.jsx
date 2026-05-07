/**
 * src/components/MessageBubble.jsx — Single chat message bubble.
 *
 * User messages: Right-aligned, RGBY accent (light) / Purple accent (dark).
 * Bot messages:  Left-aligned, glassmorphism card.
 */

import React from 'react';

/**
 * @param {{
 *   sender: 'user' | 'bot',
 *   transcript: string,
 *   createdAt: string,
 *   isDark: boolean,
 * }} props
 */
export default function MessageBubble({ sender, transcript, createdAt, isDark }) {
  const isUser = sender === 'user';

  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold
          ${isDark ? 'bg-brand-purple/30 text-brand-purple-light' : 'bg-brand-blue/10 text-brand-blue'}
        `}>
          🤖
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? isDark
                ? 'bg-brand-purple text-white rounded-br-sm'
                : 'bg-brand-blue text-white rounded-br-sm'
              : `glass-card text-slate-800 dark:text-slate-100 rounded-bl-sm`
            }
          `}
        >
          {transcript}
        </div>
        {time && (
          <span className="text-[10px] mt-1 text-slate-400 dark:text-slate-600">{time}</span>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ml-2 text-sm
          ${isDark ? 'bg-brand-purple/30 text-brand-purple-light' : 'bg-brand-blue/10 text-brand-blue'}
        `}>
          🧑
        </div>
      )}
    </div>
  );
}
