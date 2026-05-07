/**
 * src/pages/Landing.jsx — Hero landing page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Languages, Cpu, Mic, KeyRound,
  Headphones, Zap, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { getSessionId } from '../utils/session';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';

const FEATURES = [
  { label: 'Hindi + Telugu', color: 'brand-red',    Icon: Languages },
  { label: 'AI-Powered',     color: 'brand-blue',   Icon: Cpu       },
  { label: 'Voice First',    color: 'brand-green',  Icon: Mic       },
  { label: 'Zero Login',     color: 'brand-yellow', Icon: KeyRound  },
];

const FEATURE_CARDS = [
  { Icon: Mic,         title: 'Speak Naturally',     desc: 'Just tap the mic and speak in Hindi, Telugu, or both — the bot understands you.' },
  { Icon: Zap,         title: 'Ultra-Low Latency',   desc: 'Groq-powered inference delivers responses in milliseconds, not seconds.' },
  { Icon: ShieldCheck, title: 'Private by Design',   desc: 'No sign-up, no tracking. Your session lives only in your browser.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLaunch = () => {
    // Fire-and-forget health check to wake up Render server early
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      fetch(`${apiUrl}/health`).catch(() => {});
    }

    getSessionId();
    navigate('/chat');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-hero-dark text-slate-100' : 'bg-hero-light text-slate-900'}`}>

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Headphones size={24} className={isDark ? 'text-brand-purple-light' : 'text-brand-blue'} />
          <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            VoiceBot
          </span>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </nav>

      {/* ── Hero ── */}
      <main className="flex flex-col items-center justify-center px-6 pt-16 pb-20 text-center max-w-4xl mx-auto">

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-up">
          {FEATURES.map(({ label, color, Icon }) => (
            <span
              key={label}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                ${isDark
                  ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                  : `bg-${color}/10 text-${color} border border-${color}/20`
                }
              `}
            >
              <Icon size={12} />
              {label}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className={`text-5xl sm:text-6xl font-extrabold leading-tight mb-6 animate-fade-up ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Talk to AI in{' '}
          <span className={isDark ? 'text-brand-purple-light' : 'text-brand-blue'}>Hindi</span>{' '}
          &amp;{' '}
          <span className={isDark ? 'text-brand-purple' : 'text-brand-red'}>Telugu</span>
        </h1>

        <p className={`text-lg sm:text-xl max-w-xl mb-10 leading-relaxed animate-fade-up ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          A real-time multilingual voice bot powered by Groq and Bhashini.
          Speak — and hear a response in seconds.
        </p>

        {/* CTA */}
        <button
          id="launch-voice-bot-btn"
          onClick={handleLaunch}
          className={`
            flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold
            transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg animate-fade-up
            ${isDark
              ? 'bg-brand-purple text-white hover:bg-brand-purple-light shadow-brand-purple/30 hover:shadow-brand-purple/50'
              : 'bg-brand-blue text-white hover:bg-blue-600 shadow-brand-blue/30 hover:shadow-brand-blue/50'
            }
          `}
        >
          <Mic size={20} />
          Launch Voice Bot
          <ArrowRight size={20} />
        </button>

        <p className={`mt-4 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          No sign-up required · Works in Chrome &amp; Safari
        </p>
      </main>

      {/* ── Feature Cards ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-brand-purple/20 text-brand-purple-light' : 'bg-brand-blue/10 text-brand-blue'}`}>
                <Icon size={20} />
              </div>
              <h2 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
