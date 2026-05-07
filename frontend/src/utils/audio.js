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

/**
 * Play a Base64-encoded audio string in the browser.
 *
 * @param {string} base64Audio - The audio data from the backend TTS response.
 * @param {string} [mimeType='audio/wav'] - MIME type of the audio.
 * @returns {Promise<void>} Resolves when playback finishes.
 */
export function playBase64Audio(base64Audio, mimeType = 'audio/wav') {
  return new Promise((resolve, reject) => {
    const audioSrc = `data:${mimeType};base64,${base64Audio}`;
    const audio = new Audio(audioSrc);
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}
