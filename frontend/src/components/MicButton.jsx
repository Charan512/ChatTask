/**
 * src/components/MicButton.jsx — Central microphone control button.
 *
 * Renders a large circular mic button with:
 *   - Light mode: RGBY pulsing ring animation while recording.
 *   - Dark mode: Purple glowing pulse animation while recording.
 *   - Waveform bars visible during active recording.
 *   - Disabled state during API processing.
 */

import React from 'react';

function MicIcon({ isRecording }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={isRecording ? 1.5 : 2}
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// Waveform bars shown when recording
function WaveformBars() {
  return (
    <div className="flex items-center gap-[3px] h-6">
      {['wave-bar-1', 'wave-bar-2', 'wave-bar-3', 'wave-bar-4', 'wave-bar-5'].map((cls) => (
        <div
          key={cls}
          className={`w-[3px] rounded-full bg-white animate-${cls}`}
          style={{ minHeight: '4px' }}
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   isRecording: boolean,
 *   isProcessing: boolean,
 *   isDark: boolean,
 *   onStart: function,
 *   onStop: function
 * }} props
 */
export default function MicButton({ isRecording, isProcessing, isDark, onStart, onStop }) {
  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  // Base classes — always applied
  const base = `
    relative flex items-center justify-center
    w-20 h-20 rounded-full cursor-pointer
    transition-all duration-300 select-none
    focus:outline-none focus-visible:ring-4
  `;

  // State-dependent classes
  const stateClasses = isProcessing
    ? 'opacity-50 cursor-not-allowed bg-slate-400 dark:bg-slate-600'
    : isRecording
    ? isDark
      ? 'bg-brand-purple text-white animate-pulse-purple focus-visible:ring-brand-purple/50'
      : 'bg-brand-red text-white animate-pulse-rgby focus-visible:ring-brand-red/40'
    : isDark
    ? 'bg-brand-purple/80 text-white hover:bg-brand-purple hover:scale-105 focus-visible:ring-brand-purple/50'
    : 'bg-brand-blue text-white hover:bg-blue-600 hover:scale-105 focus-visible:ring-brand-blue/40';

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        id="mic-button"
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
        className={`${base} ${stateClasses}`}
      >
        {isRecording ? <WaveformBars /> : <MicIcon isRecording={isRecording} />}
      </button>

      {/* Status label */}
      <p className={`text-xs font-medium tracking-wide ${
        isProcessing
          ? 'text-slate-400 dark:text-slate-500'
          : isRecording
          ? isDark
            ? 'text-brand-purple-light'
            : 'text-brand-red'
          : 'text-slate-400 dark:text-slate-500'
      }`}>
        {isProcessing ? 'Processing...' : isRecording ? 'Tap to stop' : 'Tap to speak'}
      </p>
    </div>
  );
}
