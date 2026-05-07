/**
 * src/App.jsx — Root application component.
 *
 * Defines client-side routes:
 *   /       → Landing page
 *   /chat   → Voice Bot Chat interface
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';

export default function App() {
  return (
    <Routes>
      <Route path="/"     element={<Landing />} />
      <Route path="/chat" element={<Chat />} />
      {/* Catch-all: redirect unknown paths to home */}
      <Route path="*"     element={<Navigate to="/" replace />} />
    </Routes>
  );
}
