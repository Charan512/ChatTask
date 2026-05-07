/**
 * src/pages/Chat.jsx — Main voice bot chat interface.
 *
 * Layout:
 *   ┌─────────────┬──────────────────────────────┐
 *   │  Sidebar    │  Message list (scrollable)   │
 *   │  (history)  │                              │
 *   │             │  ── Voice Dock ──────────── │
 *   │             │   [MicButton]               │
 *   └─────────────┴──────────────────────────────┘
 *
 * Full pipeline on recording stop:
 *   audio blob → base64 → POST /api/speak → { audio, text, session_id }
 *                                        → play audio + add messages to list
 *
 * Cold-start handling:
 *   First request may take ~15s on Render free tier.
 *   We show a friendly "Waking up the server…" banner during this delay.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, PenLine, Loader2, AlertTriangle, Mic, Send } from 'lucide-react';
import { getSessionId, resetSessionId } from '../utils/session';
import { playBase64Audio } from '../utils/audio';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTheme } from '../hooks/useTheme';
import MicButton from '../components/MicButton';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import ThemeToggle from '../components/ThemeToggle';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error(
    '[Config Error] VITE_API_URL is not set. ' +
    'Copy .env.example to .env and fill in your Render backend URL.'
  );
}

// ── Cold start banner threshold (ms) ──────────────────────────────────────────
const COLD_START_THRESHOLD_MS = 4000;

export default function Chat() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // ── State ──────────────────────────────────────────────────────────────────
  const [sessionId]            = useState(getSessionId);
  const [messages, setMessages] = useState([]);         // { sender, transcript, created_at }
  const [history, setHistory]   = useState([]);         // sidebar session history
  const [isProcessing, setIsProcessing] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef(null);
  const coldStartTimerRef = useRef(null);

  // ── Scroll to bottom whenever messages change ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // ── Fetch session history from backend on mount ───────────────────────────
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages ?? []);
        setHistory(data.messages ?? []);
      } catch {
        // Non-fatal — history simply starts empty on cold start
      }
    }
    fetchHistory();
  }, [sessionId]);

  // ── Audio complete handler — called by useVoiceRecorder ──────────────────
  const handleAudioReady = useCallback(async (audioBase64) => {
    setApiError(null);
    setIsProcessing(true);

    // Start cold-start banner timer
    coldStartTimerRef.current = setTimeout(() => {
      setShowColdStart(true);
    }, COLD_START_THRESHOLD_MS);

    // Optimistically add user placeholder (transcript unknown until STT)
    const tempUserMsg = {
      sender: 'user',
      transcript: 'Processing your voice…',
      created_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          audio_base64: audioBase64,
        }),
      });

      clearTimeout(coldStartTimerRef.current);
      setShowColdStart(false);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Server error: ${res.status}`);
      }

      const { audio, text } = await res.json();

      // Replace temp user msg with real STT transcript (we don't get it back
      // directly; backend saves it but the response only has the bot reply).
      // Re-fetch history to get the saved user transcript.
      const histRes = await fetch(`${API_BASE}/api/history/${sessionId}`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setMessages(histData.messages ?? []);
        setHistory(histData.messages ?? []);
      } else {
        // Fallback: remove temp and add bot reply locally
        setMessages((prev) => [
          ...prev.filter((m) => !m._temp),
          { sender: 'bot', transcript: text, created_at: new Date().toISOString() },
        ]);
      }

      // Auto-play bot's audio response
      try {
        await playBase64Audio(audio, 'audio/wav');
      } catch {
        console.warn('[Chat] Audio playback failed — likely browser autoplay policy.');
      }
    } catch (err) {
      clearTimeout(coldStartTimerRef.current);
      setShowColdStart(false);
      setApiError(err.message);
      // Remove the temp placeholder on failure
      setMessages((prev) => prev.filter((m) => !m._temp));
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId]);

  // ── Voice recorder ────────────────────────────────────────────────────────
  const { isRecording, error: micError, startRecording, stopRecording } =
    useVoiceRecorder(handleAudioReady);

  // ── Text submit handler ──────────────────────────────────────────────────
  const handleTextSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isProcessing || isRecording) return;

    const textToSend = inputText.trim();
    setInputText('');
    setApiError(null);
    setIsProcessing(true);

    const tempUserMsg = {
      sender: 'user',
      transcript: textToSend,
      created_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          text: textToSend,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Server error: ${res.status}`);
      }

      const { text } = await res.json();

      const histRes = await fetch(`${API_BASE}/api/history/${sessionId}`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setMessages(histData.messages ?? []);
        setHistory(histData.messages ?? []);
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => !m._temp),
          { sender: 'bot', transcript: text, created_at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setApiError(err.message);
      setMessages((prev) => prev.filter((m) => !m._temp));
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, isRecording, sessionId]);

  // ── New conversation ──────────────────────────────────────────────────────
  const handleNewConversation = () => {
    resetSessionId();
    navigate(0); // Reload to re-initialise with new session
  };

  // ── Sidebar sessions (grouped by date, simplified) ────────────────────────
  const sidebarSessions = history.length > 0
    ? [{ id: sessionId, label: 'Current Session', count: history.length }]
    : [];

  return (
    <div className={`
      flex h-screen overflow-hidden transition-colors duration-300
      ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        hidden sm:flex flex-col w-64 border-r shrink-0
        ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
      `}>
        {/* Logo */}
        <div className={`
          flex items-center gap-2 px-4 py-4 border-b
          ${isDark ? 'border-slate-800' : 'border-slate-100'}
        `}>
          <Headphones
            size={20}
            className={isDark ? 'text-brand-purple-light' : 'text-brand-blue'}
          />
          <span className="font-bold text-sm">VoiceBot</span>
        </div>

        {/* New conversation button */}
        <div className="px-3 pt-3">
          <button
            id="new-conversation-btn"
            onClick={handleNewConversation}
            className={`
              w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 hover:scale-[1.01]
              ${isDark
                ? 'bg-brand-purple/20 text-brand-purple-light hover:bg-brand-purple/30 border border-brand-purple/30'
                : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border border-brand-blue/20'
              }
            `}
          >
            <PenLine size={15} />
            New Conversation
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 scroll-smooth-hide">
          <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 px-1
            ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            History
          </p>
          {sidebarSessions.length === 0 ? (
            <p className={`text-xs px-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              No history yet.
            </p>
          ) : (
            sidebarSessions.map((s) => (
              <div
                key={s.id}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-xs cursor-default
                  ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}
                `}
              >
                <span className="truncate">{s.label}</span>
                <span className={`
                  ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                  ${isDark ? 'bg-brand-purple/30 text-brand-purple-light' : 'bg-brand-blue/10 text-brand-blue'}
                `}>
                  {s.count}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Theme toggle at bottom of sidebar */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile header (sidebar not visible) */}
        <header className={`
          sm:hidden flex items-center justify-between px-4 py-3 border-b shrink-0
          ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
        `}>
          <div className="flex items-center gap-2">
            <Headphones
              size={20}
              className={isDark ? 'text-brand-purple-light' : 'text-brand-blue'}
            />
            <span className="font-bold text-sm">VoiceBot</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="mobile-new-btn"
              onClick={handleNewConversation}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium
                ${isDark ? 'text-brand-purple-light bg-brand-purple/20' : 'text-brand-blue bg-brand-blue/10'}`}
            >
              + New
            </button>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </header>

        {/* ── Cold-start banner ──────────────────────────────────────────── */}
        {showColdStart && (
          <div className={`
            mx-4 mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm shrink-0
            ${isDark
              ? 'bg-brand-purple/15 border border-brand-purple/30 text-brand-purple-light'
              : 'bg-brand-yellow/10 border border-brand-yellow/30 text-amber-700'
            }
          `}>
            <Loader2 size={16} className="animate-spin" />
            <span>
              <strong>Waking up the server…</strong> Render free tier may take ~15s on first request.
            </span>
          </div>
        )}

        {/* ── API / Mic Error banner ─────────────────────────────────────── */}
        {(apiError || micError) && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm bg-brand-red/10 border border-brand-red/30 text-brand-red shrink-0">
            <AlertTriangle size={16} />
            <span>{apiError || micError}</span>
          </div>
        )}

        {/* ── Messages list ─────────────────────────────────────────────── */}
        <div
          id="messages-container"
          className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth-hide"
        >
          {messages.length === 0 && !isProcessing ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Mic
                size={48}
                className={isDark ? 'text-slate-600' : 'text-slate-300'}
              />
              <p className={`font-semibold text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Ready to listen
              </p>
              <p className={`text-sm max-w-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Tap the microphone and speak in Hindi or Telugu to start a conversation.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id ?? idx}
                  sender={msg.sender}
                  transcript={msg.transcript}
                  createdAt={msg.created_at}
                  isDark={isDark}
                />
              ))}
              {isProcessing && <TypingIndicator isDark={isDark} />}
            </>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Dock ────────────────────────────────────────────────── */}
        <div className={`
          shrink-0 flex items-center gap-3 py-4 px-4 border-t
          ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}
        `}>
          <form 
            onSubmit={handleTextSubmit}
            className={`
              flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border
              transition-colors
              ${isDark 
                ? 'bg-slate-900 border-slate-700 focus-within:border-brand-purple-light' 
                : 'bg-white border-slate-200 focus-within:border-brand-blue'}
            `}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              disabled={isProcessing || isRecording}
              className={`
                flex-1 bg-transparent border-none outline-none text-sm
                ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}
              `}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing || isRecording}
              className={`
                p-1.5 rounded-full transition-colors
                ${inputText.trim() && !isProcessing && !isRecording
                  ? isDark ? 'text-brand-purple-light hover:bg-brand-purple/20' : 'text-brand-blue hover:bg-brand-blue/10'
                  : 'text-slate-400 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <Send size={18} />
            </button>
          </form>

          <div className="shrink-0">
            <MicButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              isDark={isDark}
              onStart={startRecording}
              onStop={stopRecording}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
