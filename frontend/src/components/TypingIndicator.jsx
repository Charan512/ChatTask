/**
 * src/components/TypingIndicator.jsx — Animated "Bot is thinking..." indicator.
 *
 * Three bouncing dots rendered while waiting for the backend to respond.
 */

import React from 'react';

export default function TypingIndicator({ isDark }) {
  return (
    <div className="flex justify-start mb-3">
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm
        ${isDark ? 'bg-brand-purple/30 text-brand-purple-light' : 'bg-brand-blue/10 text-brand-blue'}
      `}>
        🤖
      </div>
      <div className="glass-card px-4 py-3 flex items-center gap-1.5">
        <span className={`
          inline-block w-2 h-2 rounded-full animate-bounce-dot-1
          ${isDark ? 'bg-brand-purple-light' : 'bg-brand-blue'}
        `} />
        <span className={`
          inline-block w-2 h-2 rounded-full animate-bounce-dot-2
          ${isDark ? 'bg-brand-purple-light' : 'bg-brand-blue'}
        `} />
        <span className={`
          inline-block w-2 h-2 rounded-full animate-bounce-dot-3
          ${isDark ? 'bg-brand-purple-light' : 'bg-brand-blue'}
        `} />
      </div>
    </div>
  );
}
