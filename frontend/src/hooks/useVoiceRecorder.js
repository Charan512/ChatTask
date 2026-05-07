/**
 * src/hooks/useVoiceRecorder.js — MediaRecorder hook for audio capture.
 *
 * Handles the full record → stop → convert pipeline.
 * Returns state flags and control functions to the Chat page.
 *
 * Cross-browser notes:
 *   - Chrome: prefers audio/webm;codecs=opus
 *   - Safari: only supports audio/mp4 for MediaRecorder
 */

import { useState, useRef, useCallback } from 'react';
import { getSupportedMimeType, blobToBase64 } from '../utils/audio';

/**
 * @typedef {Object} UseVoiceRecorderReturn
 * @property {boolean} isRecording  - True while the mic is actively capturing.
 * @property {string|null} error    - Any permission or device error message.
 * @property {Function} startRecording - Begin capturing microphone audio.
 * @property {Function} stopRecording  - Stop capturing; calls onComplete(base64).
 */

/**
 * @param {function(string): void} onComplete
 *   Callback fired with the Base64 audio string when recording stops.
 * @returns {UseVoiceRecorderReturn}
 */
export function useVoiceRecorder(onComplete) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all mic tracks to release the browser indicator
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        try {
          const base64 = await blobToBase64(blob);
          onComplete(base64, mimeType || 'audio/webm');
        } catch (convErr) {
          setError('Failed to process audio. Please try again.');
          console.error('[VoiceRecorder] Blob conversion error:', convErr);
        }
      };

      recorder.onerror = (e) => {
        setError(`Recording error: ${e.error?.message ?? 'Unknown error'}`);
        setIsRecording(false);
      };

      // Collect data every 250ms for smoother streaming (not used here but
      // avoids a silent failure if onstop is never triggered on some browsers)
      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow mic permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
      console.error('[VoiceRecorder] startRecording error:', err);
    }
  }, [onComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, error, startRecording, stopRecording };
}
