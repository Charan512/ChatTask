/**
 * src/utils/audio.js — Audio capture and conversion utilities.
 *
 * Provides a browser-compatible MediaRecorder wrapper for Chrome and Safari.
 * Safari requires 'audio/mp4' MIME type; Chrome prefers 'audio/webm;codecs=opus'.
 */

/**
 * Determine the best supported MIME type for MediaRecorder across browsers.
 * Falls back to an empty string so the browser uses its default.
 *
 * @returns {string} The MIME type string.
 */
export function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',             // Safari
    'audio/ogg;codecs=opus',
    '',                      // Browser default
  ];
  return types.find((type) => !type || MediaRecorder.isTypeSupported(type)) ?? '';
}

/**
 * Convert a Blob to a Base64-encoded string.
 *
 * @param {Blob} blob - The audio blob from MediaRecorder.
 * @returns {Promise<string>} Base64 string (without data URI prefix).
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result = "data:audio/webm;base64,AAAA..."
      // Strip the data URI prefix to send only the raw Base64 payload
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Module-level AudioContext — created once, reused for all playback.
// Must be created/resumed inside a user-gesture handler to stay unlocked.
let _audioCtx = null;

/**
 * Call this once inside a user-gesture handler (e.g. mic button click)
 * to unlock the AudioContext for subsequent async playback calls.
 */
export function unlockAudioContext() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
}

/**
 * Play a Base64-encoded audio string in the browser using AudioContext.
 * AudioContext is not subject to the same autoplay restrictions as Audio elements.
 *
 * @param {string} base64Audio - The audio data from the backend TTS response.
 * @param {string} [mimeType='audio/wav'] - MIME type of the audio.
 * @returns {Promise<void>} Resolves when playback finishes.
 */
export function playBase64Audio(base64Audio, mimeType = 'audio/wav') {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure context exists (fallback if unlockAudioContext wasn't called)
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') {
        await _audioCtx.resume();
      }

      // Decode base64 to binary
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Decode the audio buffer and play it
      const audioBuffer = await _audioCtx.decodeAudioData(bytes.buffer);
      const source = _audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(_audioCtx.destination);
      source.onended = resolve;
      source.start(0);
    } catch (err) {
      reject(err);
    }
  });
}
